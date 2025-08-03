"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const auth_1 = __importDefault(require("../../auth"));
const getUserProject_1 = require("./getUserProject");
const project = express_1.default.Router();
project.use(auth_1.default);
project.post('/new', controller_1.createNewProject);
project.get('/userProjects', getUserProject_1.getUserProject);
exports.default = project;
