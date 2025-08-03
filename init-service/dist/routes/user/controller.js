"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signin = exports.signup = void 0;
const prisma_client_1 = __importDefault(require("../../prisma-client"));
const zod_1 = __importDefault(require("zod"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const js_cookie_1 = __importDefault(require("js-cookie"));
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
}
const secret = process.env.JWT_SECRET;
// Validation schema using zod
const signupBody = zod_1.default.object({
    name: zod_1.default.string().min(1, { message: 'Invalid name' }),
    email: zod_1.default.string().email({ message: 'Invalid email address' }),
    password: zod_1.default
        .string()
        .min(6, { message: 'Password should be at least 6 characters long' }),
});
// Signup function
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    const existingUser = yield prisma_client_1.default.user.findUnique({
        where: { email: body.email },
    });
    if (existingUser) {
        return res.status(409).json({
            message: 'Email already taken',
        });
    }
    try {
        // Create the new user
        const newUser = yield prisma_client_1.default.user.create({
            data: {
                name: body.name,
                email: body.email,
                password: body.password, // Hash the password before storing
            },
        });
        const userId = newUser.id;
        const token = jsonwebtoken_1.default.sign({ userId }, secret);
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
    }
    catch (err) {
        console.error('Error creating user:', err);
        return res.status(500).json({
            message: 'Internal Server Error',
        });
    }
});
exports.signup = signup;
const signinBody = zod_1.default.object({
    email: zod_1.default.string().email({ message: 'Invalid email address' }),
    password: zod_1.default
        .string()
        .min(6, { message: 'Password should be more than 6 chars' }),
});
// Signin function (Stub for now)
const signin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const result = signinBody.safeParse(body);
    if (!result.success) {
        return res.status(400).json({
            message: 'Validation error',
            errors: result.error.errors,
        });
    }
    try {
        const User = yield prisma_client_1.default.user.findUnique({
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
        const token = jsonwebtoken_1.default.sign({ userId }, secret);
        //setting cookie
        const authToken = `Bearer ${token}`;
        js_cookie_1.default.set('auth-token', authToken, { expires: 5, sameSite: 'Lax' });
        return res.status(200).json({
            message: 'Login successful',
            data: {
                name: User.name,
                token: token,
            },
        });
    }
    catch (err) {
        console.log('Cannot signin', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
exports.signin = signin;
