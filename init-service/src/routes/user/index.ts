import {Router} from 'express';
import express from 'express';
import {signin, signup} from './controller';

const user: Router = express.Router();

user.post('/signup', signup);
user.post('/signin', signin);

export default user;
