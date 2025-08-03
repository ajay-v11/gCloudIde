import {Request, Response} from 'express';
import prisma from '../../prisma-client';
import zod from 'zod';

import jwt, {Secret} from 'jsonwebtoken';
import Cookies from 'js-cookie';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}

const secret: Secret = process.env.JWT_SECRET;

// Validation schema using zod
const signupBody = zod.object({
  name: zod.string().min(1, {message: 'Invalid name'}),
  email: zod.string().email({message: 'Invalid email address'}),
  password: zod
    .string()
    .min(6, {message: 'Password should be at least 6 characters long'}),
});

// Signup function
export const signup = async (req: Request, res: Response): Promise<any> => {
  const body = req.body;

  // Validate request body
  const result = signupBody.safeParse(body);
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation errors',
      errors: result.error.errors,
    });
  }

  // Check if the user already exists
  const existingUser = await prisma.user.findUnique({
    where: {email: body.email},
  });

  if (existingUser) {
    return res.status(409).json({
      message: 'Email already taken',
    });
  }

  try {
    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password, // Hash the password before storing
      },
    });

    const userId = newUser.id;

    const token = jwt.sign({userId}, secret);

    //Settingcookies

    res.cookie('auth_token', token, {
      httpOnly: true, // Ensures cookie is not accessible via JavaScript
      secure: process.env.NODE_ENV === 'production', // Only use 'secure' flag in production
      maxAge: 3600000, // 1 hour in milliseconds
      // Restricts cookie to same-site requests
    });

    // Respond with success
    return res.status(201).json({
      message: 'User created successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        token: token,
      },
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({
      message: 'Internal Server Error',
    });
  }
};

const signinBody = zod.object({
  email: zod.string().email({message: 'Invalid email address'}),
  password: zod
    .string()
    .min(6, {message: 'Password should be more than 6 chars'}),
});

// Signin function (Stub for now)
export const signin = async (req: Request, res: Response): Promise<any> => {
  const body = req.body;

  const result = signinBody.safeParse(body);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation error',
      errors: result.error.errors,
    });
  }

  try {
    const User = await prisma.user.findUnique({
      where: {
        email: body.email,
        password: body.password,
      },
    });

    if (!User) {
      return res.status(409).json({
        message: 'Invalid Login credentials',
      });
    }

    const userId = User.id;
    const token = jwt.sign({userId}, secret);

    //setting cookie

    const authToken = `Bearer ${token}`;

    Cookies.set('auth-token', authToken, {expires: 5, sameSite: 'Lax'});

    return res.status(200).json({
      message: 'Login successful',
      data: {
        name: User.name,
        token: token,
      },
    });
  } catch (err) {
    console.log('Cannot signin', err);
    return res.status(500).json({message: 'Internal Server Error'});
  }
};
