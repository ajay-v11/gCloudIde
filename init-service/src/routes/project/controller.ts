import {Request, Response} from 'express';

export const createNewProject = (req: Request, res: Response) => {
  const project = 'hello fromt the project';
  res.status(200).json({project});
};
