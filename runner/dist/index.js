"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const ws_1 = require("./ws");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const httpServer = (0, http_1.createServer)(app);
(0, ws_1.initWebSockets)(httpServer);
app.get('/health', (req, res) => {
    res.send('Server is running');
});
const port = process.env.PORT || 3001;
httpServer.listen(port, () => {
    console.log(`listening on *:${port}`);
});
