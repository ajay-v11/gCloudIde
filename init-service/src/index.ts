import express, {Router} from 'express';
import cors from 'cors';
import router from './routes/routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req: any, res: any) => {
  const response = res.json({
    message: 'server running',
  });
});

app.use('/api/v1', router);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`listening on *:${port}`);
});
