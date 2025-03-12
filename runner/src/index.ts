import express from 'express';
import {createServer} from 'http';
import cors from 'cors';
import {initWebSockets} from './ws';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
const httpServer = createServer(app);

initWebSockets(httpServer);

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const port = process.env.PORT || 3001;
httpServer.listen(port, () => {
  console.log(`listening on *:${port}`);
});
