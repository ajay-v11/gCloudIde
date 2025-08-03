import {NextFunction, Request, Response} from 'express';

import jwt, {Secret} from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

const secret: Secret = process.env.JWT_SECRET;

const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({
      message: 'Invalid auth Header',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret) as {userId: number};

    (req as any).userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({
      message: 'cannot decode the token',
    });
  }
};

export default authenticateUser;
