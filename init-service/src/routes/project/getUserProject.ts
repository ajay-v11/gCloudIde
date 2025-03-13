import {Request, Response} from 'express';
import zod from 'zod';
import prisma from '../../prisma-client';

export const getUserProject = async (
  req: Request,
  res: Response
): Promise<any> => {
  //@ts-ignore
  const userId = req.userId;

  try {
    const userRepls = await prisma.user.findUnique({
      where: {id: userId},
      include: {
        repls: {
          orderBy: {createdAt: 'desc'}, // Sort by creation date (newest first)
          take: 7, // Limit to the 7 most recent repls
          select: {
            title: true, // Only fetch the title
          },
        },
      },
    });

    if (!userRepls) {
      return res.status(404).json({message: 'User not found'});
    }

    const recentTitles = userRepls.repls.map((repl) => repl.title);

    res.status(200).json({
      message: 'Recent projects fetched successfully',
      recentTitles,
    });
  } catch (err) {
    console.log('Internal server error', err);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
