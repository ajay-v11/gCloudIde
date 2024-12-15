import {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';
import path from 'path';
import jwt, {Secret} from 'jsonwebtoken';

// Load the .env file from the top-level directory
dotenv.config({path: path.resolve(__dirname, '../../../.env')});

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

const secret: Secret = process.env.JWT_SECRET;

const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  console.log('inside the auth');
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({
      message: 'Invalid auth Header',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    console.log(decoded);
    next();
  } catch (err) {
    return res.status(403).json({
      message: 'cannot decode the token',
    });
  }
};

export default authenticateUser;
