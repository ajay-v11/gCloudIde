import {Server} from 'socket.io';
import {Server as HttpServer} from 'http';
import {createPtyProcess} from './pty';
import {generateFileTree, getCode, saveFile} from './fs';
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';
import {saveToGCS} from './gcp';
import path from 'path';
import fs from 'fs';
import {exec} from 'child_process';

// Helper function to execute a command and return stdout/stderr
const executeCommand = (command: string, socket: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        socket.emit('terminal:data', `Error: ${error.message}\r\n`);
        reject(error);
      }
      if (stderr) {
        socket.emit('terminal:data', `Stderr: ${stderr}\r\n`);
      }
      socket.emit('terminal:data', `Output: ${stdout}\r\n`);
      resolve(stdout);
    });

    // Handle process exit
    childProcess.on('exit', (code) => {
      socket.emit('terminal:data', `Process exited with code ${code}\r\n`);
    });
  });
};

export const initWebSockets = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {origin: '*'},
  });

  // Docker path: '/workspace'

  //const basePath = path.resolve(process.cwd(), 'workspace');
  const basePath = path.resolve('/workspace');
  const workspacePath = path.resolve('/workspace');

  // Ensure workspace exists with restricted permissions
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, {recursive: true, mode: 0o755});
  }

  const watcher = chokidar.watch(basePath, {persistent: true});

  const refreshFileTree = debounce(async () => {
    try {
      const fileTree = await generateFileTree(basePath);
      io.emit('file:refresh', fileTree);
    } catch (err) {
      console.error('File tree refresh failed:', err);
    }
  }, 200);

  watcher.on('all', (event, filePath) => {
    console.log(`File event: ${event} on ${filePath}`);
    refreshFileTree();
  });

  io.on('connection', async (socket) => {
    console.log('User connected', socket.id);
    const ptyProcess = createPtyProcess();

    socket.emit('terminal:data', 'Welcome to the terminal!\r\n');

    ptyProcess.onData((data: string) => socket.emit('terminal:data', data));

    //to use the
    socket.on('terminal:write', (data) => {
      const command = data.trim();

      // Check if the command is a cd command
      if (command.startsWith('cd ')) {
        const targetDir = command.slice(3).trim();
        let fullPath;

        // Handle absolute paths
        if (targetDir.startsWith('/')) {
          fullPath = targetDir;
        } else {
          // For relative paths, we need to get the current directory
          // This is tricky since we don't track it, but we can
          // make an educated guess based on the workspacePath
          fullPath = path.resolve(workspacePath, targetDir);
        }

        // Ensure the path stays within workspace
        if (!fullPath.startsWith(workspacePath)) {
          socket.emit('terminal:data', 'Cannot navigate outside workspace\r\n');
          // Send a new prompt
          socket.emit('terminal:data', 'workspace> ');
          return;
        }
      }

      // Forward the command to the terminal
      ptyProcess.write(data);
    });

    //terminal resizing
    socket.on('terminal:resize', ({cols, rows}) => {
      if (typeof cols === 'number' && typeof rows === 'number') {
        ptyProcess.resize(cols, rows);
      } else {
        console.error('Invalid resize parameters');
      }
    });

    try {
      const fileTree = await generateFileTree(basePath);
      socket.emit('file:tree', fileTree);
    } catch (err) {
      socket.emit('error', {message: 'Failed to load file tree'});
    }

    socket.on('file:selected', async (fileName) => {
      try {
        const sanitizedFileName = path.basename(fileName);
        const code = await getCode(sanitizedFileName);
        socket.emit('code', code);
      } catch (err) {
        socket.emit('error', {message: 'Unable to read file'});
      }
    });

    socket.on('file:change', async ({selectedFileName, content}) => {
      try {
        // Sanitize and validate file path
        const sanitizedFileName = path.basename(selectedFileName);
        const filePath = path.resolve(basePath, sanitizedFileName);

        // Ensure file is within workspace
        if (!filePath.startsWith(basePath)) {
          throw new Error('Invalid file path');
        }

        await saveFile(filePath, content);
        //await saveToGCS('4', filePath, content);
        socket.emit('file:save:success');
      } catch (err) {
        socket.emit('error', {message: 'Unable to update file'});
      }
    });

    socket.on('file:run', async (fileName) => {
      try {
        // Sanitize and validate file path
        const sanitizedFileName = path.basename(fileName);
        const filePath = path.resolve(basePath, sanitizedFileName);

        // Ensure file is within workspace
        if (!filePath.startsWith(basePath)) {
          throw new Error('Invalid file path');
        }

        let command;

        // Handle different file types
        if (fileName.endsWith('.py')) {
          // Python (interpreted)
          command = `python3 ${filePath}`;
        } else if (fileName.endsWith('.js')) {
          // JavaScript (interpreted)
          command = `node ${filePath}`;
        } else if (fileName.endsWith('.java')) {
          // Java (compiled)
          const className = path.basename(fileName, '.java');
          const classPath = path.dirname(filePath);

          // Compile the Java file
          await executeCommand(`javac ${filePath}`, socket);

          // Execute the compiled bytecode
          command = `java -cp ${classPath} ${className}`;
        } else if (fileName.endsWith('.cpp')) {
          // C++ (compiled)
          const outputPath = path.join(basePath, 'output'); // Output binary path
          const outputFile = path.join(basePath, 'output'); // Output binary name

          // Compile the C++ file
          await executeCommand(`g++ ${filePath} -o ${outputPath}`, socket);

          // Execute the compiled binary
          command = outputFile;
        } else {
          throw new Error('Unsupported file type');
        }

        // Execute the command
        await executeCommand(command, socket);
      } catch (err) {
        socket.emit('error', {message: 'Unable to run file'});
      } finally {
        // Clean up compiled files (Java .class files or C++ binaries)
        if (fileName.endsWith('.java')) {
          const className = path.basename(fileName, '.java');
          const classFile = path.resolve(basePath, `${className}.class`);
          if (fs.existsSync(classFile)) {
            fs.unlinkSync(classFile); // Delete the .class file
          }
        } else if (fileName.endsWith('.cpp')) {
          const outputFile = path.join(basePath, 'output');
          if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile); // Delete the compiled binary
          }
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
      ptyProcess.kill();
    });
  });
};
