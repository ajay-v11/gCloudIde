import express, {
  Errback,
  NextFunction,
  Request,
  Response,
  Router,
} from 'express';
import user from './user';
import project from './project';

const router: Router = express.Router();
router.use((err: Errback, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({message: 'Something went wrong'});
});

router.use('/user', user);
router.use('/project', project);

export default router;
