"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebSockets = void 0;
const socket_io_1 = require("socket.io");
const pty_1 = require("./pty");
const fs_1 = require("./fs");
const chokidar_1 = __importDefault(require("chokidar"));
const lodash_debounce_1 = __importDefault(require("lodash.debounce"));
const gcp_1 = require("./gcp");
const path_1 = __importDefault(require("path"));
const initWebSockets = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: { origin: '*' },
    });
    // Docker path: '/workspace'
    const basePath = path_1.default.resolve(process.cwd(), 'workspace');
    const watcher = chokidar_1.default.watch(basePath, { persistent: true });
    const refreshFileTree = (0, lodash_debounce_1.default)(() => __awaiter(void 0, void 0, void 0, function* () {
        const fileTree = yield (0, fs_1.generateFileTree)(basePath);
        io.emit('file:refresh', fileTree);
    }), 200);
    watcher.on('all', (event, filePath) => {
        console.log(`File event: ${event} on ${filePath}`);
        refreshFileTree();
    });
    io.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('A user connected', socket.id);
        const ptyProcess = (0, pty_1.createPtyProcess)();
        socket.emit('terminal:data', 'Welcome to the terminal!\r\n');
        ptyProcess.onData((data) => socket.emit('terminal:data', data));
        socket.on('terminal:write', (data) => ptyProcess.write(data));
        socket.on('terminal:resize', ({ cols, rows }) => {
            if (typeof cols === 'number' && typeof rows === 'number') {
                ptyProcess.resize(cols, rows);
            }
            else {
                console.error('Invalid resize parameters:', { cols, rows });
            }
        });
        const fileTree = yield (0, fs_1.generateFileTree)(basePath);
        socket.emit('file:tree', fileTree);
        socket.on('file:selected', (fileName) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const code = yield (0, fs_1.getCode)(fileName);
                socket.emit('code', code);
            }
            catch (err) {
                console.error('Error reading file:', err);
                socket.emit('error', { message: 'Unable to read file' });
            }
        }));
        socket.on('file:change', (_a) => __awaiter(void 0, [_a], void 0, function* ({ selectedFileName, content }) {
            console.log(selectedFileName);
            try {
                // Docker path: '/workspace' + selectedFileName
                const filePath = path_1.default.resolve(basePath, selectedFileName.replace(/^\//, ''));
                console.log('Writing to file:', filePath);
                yield (0, fs_1.saveFile)(filePath, content);
                yield (0, gcp_1.saveToGCS)('4', filePath, content);
                console.log('File updated successfully.');
            }
            catch (err) {
                console.error('Error writing file:', err);
                socket.emit('error', { message: 'Unable to update file' });
            }
        }));
        socket.on('disconnect', () => {
            console.log('User disconnected', socket.id);
            ptyProcess.kill();
        });
    }));
};
exports.initWebSockets = initWebSockets;
