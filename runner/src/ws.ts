import {Server} from 'socket.io';
import {Server as HttpServer} from 'http';
import {createPtyProcess} from './pty';
import {generateFileTree, getCode, saveFile} from './fs';
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';
import {saveToGCS} from './gcp';

export const initWebSockets = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {origin: '*'},
  });

  const basePath = '/workspace';
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
        const filePath = '/workspace' + selectedFileName;
        console.log('Writing to file:', filePath);

        await saveFile(filePath, content);
        await saveToGCS('4', filePath, content);
        console.log('File updated successfully.');
      } catch (err) {
        console.error('Error writing file:', err);
        socket.emit('error', {message: 'Unable to update file'});
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
      ptyProcess.kill();
    });
  });
};
