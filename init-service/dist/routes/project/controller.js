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
exports.createNewProject = void 0;
const zod_1 = __importDefault(require("zod"));
const prisma_client_1 = __importDefault(require("../../prisma-client"));
const gcp_1 = require("./gcp");
if (!process.env.GCS_BUCKET) {
    throw new Error('GCS_BUCKET is not defined in environment variables');
}
const projectSchema = zod_1.default.object({
    title: zod_1.default.string().min(1, { message: 'name should not be empty' }),
    language: zod_1.default.string().min(1, { message: 'Language should not be empty' }),
});
const createNewProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    //@ts-ignore
    const userId = req.userId;
    const result = projectSchema.safeParse(body);
    if (!result.success) {
        console.log('Validation errors', result.error.errors);
        return res.status(400).json({
            message: 'Validation errors',
            errors: result.error.errors,
        });
    }
    try {
        console.log('GCS Bucket:', process.env.GCS_BUCKET);
        console.log('GCP Project ID:', process.env.GCP_PROJECT_ID);
        const newRepl = yield prisma_client_1.default.repl.create({
            data: {
                title: body.title,
                language: body.language,
                author: {
                    connect: { id: userId },
                },
            },
        });
        const replId = newRepl.id;
        const lang = newRepl.language;
        //uncomment the below line to copyfolders
        yield (0, gcp_1.copyGCSFolder)(`base-code/${lang}`, `user-code/${replId}`);
        res.status(200).json({
            message: 'Project created successfully',
            replid: replId,
            userid: userId,
        });
    }
    catch (err) {
        console.error('Error in createProject:', err);
        return res.status(500).json({
            message: 'Internal sever  errro',
        });
    }
});
exports.createNewProject = createNewProject;
