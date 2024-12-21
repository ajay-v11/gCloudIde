import {Server} from 'socket.io';
import {Server as HttpServer} from 'http';
import {createPtyProcess} from './pty';
import {generateFileTree, getCode} from './fs';
import chokidar from 'chokidar';
import path from 'path';
import fsp from 'fs/promises';
import debounce from 'lodash.debounce';

export const initWebSockets = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {origin: '*'},
  });

  const basePath = path.resolve(process.env.INIT_CWD + '/user');
  const watcher = chokidar.watch(basePath, {persistent: true});

  const refreshFileTree = debounce(async () => {
    const fileTree = await generateFileTree(basePath);
    io.emit('file:refresh', fileTree);
  }, 200);

  watcher.on('all', (event, filePath) => {
    console.log(`File event: ${event} on ${filePath}`);
    refreshFileTree();
  });

  io.on('connection', async (socket) => {
    console.log('A user connected', socket.id);
    const ptyProcess = createPtyProcess();

    socket.emit('terminal:data', 'Welcome to the terminal!\r\n');

    ptyProcess.onData((data: string) => socket.emit('terminal:data', data));

    socket.on('terminal:write', (data) => ptyProcess.write(data));
    socket.on('terminal:resize', ({cols, rows}) => {
      if (typeof cols === 'number' && typeof rows === 'number') {
        ptyProcess.resize(cols, rows);
      } else {
        console.error('Invalid resize parameters:', {cols, rows});
      }
    });

    const fileTree = await generateFileTree(basePath);
    socket.emit('file:tree', fileTree);

    socket.on('file:selected', async (fileName) => {
      try {
        const code = await getCode(fileName);
        socket.emit('code', code);
      } catch (err) {
        console.error('Error reading file:', err);
        socket.emit('error', {message: 'Unable to read file'});
      }
    });

    socket.on('file:change', async ({selectedFileName, content}) => {
      console.log(selectedFileName);
      try {
        const filePath = process.env.INIT_CWD + '/user' + selectedFileName;
        console.log('Writing to file:', filePath);

        await fsp.writeFile(filePath, content);
        console.log('File updated successfully.');
      } catch (err) {
        console.error('Error writing file:', err);
        socket.emit('error', {message: 'Unable to update file'});
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
      ptyProcess.kill();
      if (io.engine.clientsCount === 0) {
        watcher.close();
        console.log('Watcher closed as all clients disconnected.');
      }
    });
  });
};
