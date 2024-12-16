import {Request, Response} from 'express';
import zod from 'zod';
import prisma from '../../prisma-client';
import {copyGCSFolder} from './gcp';

const projectSchema = zod.object({
  title: zod.string().min(1, {message: 'name should not be empty'}),
  language: zod.string().min(1, {message: 'Language should not be empty'}),
});

export const createNewProject = async (
  req: Request,
  res: Response
): Promise<any> => {
  console.log('hello fromt the project');

  const body = req.body;
  //@ts-ignore
  const userId = req.userId;

  const result = projectSchema.safeParse(body);
  if (!result.success) {
    console.log('Validation errors', result.error.errors);
    return res.status(400).json({
      message: 'Validation errors',
      errors: result.error.errors,
    });
  }

  try {
    const newRepl = await prisma.repl.create({
      data: {
        title: body.title,
        language: body.language,
        author: {
          connect: {id: userId},
        },
      },
    });

    const replId = newRepl.id;
    const lang = newRepl.language;

    //uncomment the below line to copyfolders

    //await copyGCSFolder(`base/${lang}`, `code/${userId}/${replId}`);

    res.status(200).json({
      message: 'Project created successfully',
      replid: replId,
    });
  } catch (err) {
    console.log('Internal server error', err);
    return res.status(500).json({
      message: 'Internal sever  errro',
    });
  }
};
