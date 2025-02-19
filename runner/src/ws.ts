import {Server} from 'socket.io';
import {Server as HttpServer} from 'http';
import {createPtyProcess} from './pty';
import {generateFileTree, getCode, saveFile} from './fs';
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';
import {saveToGCS} from './gcp';
import path from 'path';
import fs from 'fs';

export const initWebSockets = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {origin: '*'},
  });

  // Docker path: '/workspace'
  const basePath = path.resolve(process.cwd(), 'workspace');

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

    socket.on('terminal:write', (data) => ptyProcess.write(data));
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

    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
      ptyProcess.kill();
    });
  });
};
