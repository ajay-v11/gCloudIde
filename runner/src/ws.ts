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

const executeCommand = (command: string, socket: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        socket.emit('terminalOutput:data', `Error: ${error.message}\r\n`);
        reject(error);
      }
      if (stderr) {
        socket.emit('terminalOutput:data', `Stderr: ${stderr}\r\n`);
      }
      socket.emit('terminalOutput:data', `Output: ${stdout}\r\n`);

      // Check for multiple plot files in the output
      const plotMatches = stdout.matchAll(
        /Plot saved to: (.+\.(png|jpg|jpeg|gif))/g
      );
      for (const match of plotMatches) {
        const plotFilePath = match[1];
        try {
          const plotImage = fs.readFileSync(plotFilePath, {encoding: 'base64'});
          socket.emit('plot:image', plotImage);
        } catch (readError) {
          socket.emit(
            'terminalOutput:data',
            `Failed to read plot file: ${plotFilePath}\r\n`
          );
        }
      }

      resolve(stdout);
    });

    // Handle process exit
    childProcess.on('exit', (code) => {
      socket.emit(
        'terminalOutput:data',
        `Process exited with code ${code}\r\n`
      );
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
  let replId;

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

    socket.on('init', (params) => {
      replId = params;
      console.log('recieved replId:-', replId);

      // You can now use these parameters in your backend logic
    });

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
        try {
          await saveToGCS(`user-code/${replId}`, filePath, content);
        } catch (gcsError) {
          console.error('GCS save failed but continuing:', gcsError);
          // Optionally notify the client but don't fail the whole operation
          socket.emit('warning', {
            message: 'File saved locally but cloud backup failed',
          });
        }
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

        // For HTML files, we'll send the HTML content to be rendered in an iframe
        if (fileName.endsWith('.html')) {
          try {
            const htmlContent = fs.readFileSync(filePath, 'utf8');

            // Check if there are associated CSS files
            const baseName = path.basename(fileName, '.html');
            const cssFilePath = path.join(
              path.dirname(filePath),
              `${baseName}.css`
            );

            let cssContent = '';
            if (fs.existsSync(cssFilePath)) {
              cssContent = fs.readFileSync(cssFilePath, 'utf8');
            }

            // Send HTML and CSS content to the client
            socket.emit('html:preview', {html: htmlContent, css: cssContent});
            socket.emit('terminalOutput:data', 'HTML preview loaded.\r\n');
            return;
          } catch (err) {
            socket.emit('error', {message: 'Failed to load HTML content'});
            return;
          }
        }

        // For CSS files, check if there's an associated HTML file to preview together
        if (fileName.endsWith('.css')) {
          try {
            const baseName = path.basename(fileName, '.css');
            const htmlFilePath = path.join(
              path.dirname(filePath),
              `${baseName}.html`
            );

            // If HTML file exists, run it instead
            if (fs.existsSync(htmlFilePath)) {
              const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
              const cssContent = fs.readFileSync(filePath, 'utf8');

              socket.emit('html:preview', {html: htmlContent, css: cssContent});
              socket.emit(
                'terminalOutput:data',
                'HTML preview with CSS loaded.\r\n'
              );
              return;
            } else {
              socket.emit(
                'terminalOutput:data',
                'No associated HTML file found. CSS files need an HTML file to be previewed.\r\n'
              );
              return;
            }
          } catch (err) {
            socket.emit('error', {message: 'Failed to load CSS/HTML content'});
            return;
          }
        }

        let command;

        // Handle different file types
        if (fileName.endsWith('.py')) {
          // Python (interpreted)
          command = `python3 ${filePath}`;
        } else if (fileName.endsWith('.js')) {
          // JavaScript (interpreted)
          command = `node ${filePath}`;
        } else if (fileName.endsWith('.php')) {
          command = `php ${filePath}`;
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
