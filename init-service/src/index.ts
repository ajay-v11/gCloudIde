import 'dotenv/config';
import express, {Router} from 'express';
import cors from 'cors';
import router from './routes/routes';
import morgan from 'morgan';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req: any, res: any) => {
  const response = res.json({
    message: 'server running',
  });
});

app.use('/api/v1', router);

const port = parseInt(process.env.PORT || '3000', 10);

app.listen(port, '0.0.0.0', () => {
  console.log(`listening on *:${port}`);
});
