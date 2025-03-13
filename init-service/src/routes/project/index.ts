import {Router} from 'express';
import express from 'express';
import {createNewProject} from './controller';
import authenticateUser from '../../auth';
import {getUserProject} from './getUserProject';

const project: Router = express.Router();

project.use(authenticateUser);

project.post('/new', createNewProject);

project.get('/userProjects', getUserProject);

export default project;
