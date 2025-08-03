"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const user = express_1.default.Router();
user.post('/signup', controller_1.signup);
user.post('/signin', controller_1.signin);
exports.default = user;
