import {Router} from 'express';
import express from 'express';
import {createNewProject} from './controller';
import authenticateUser from '../../auth';

const project: Router = express.Router();

project.use(authenticateUser);

project.post('/new', createNewProject);

export default project;
