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
exports.getUserProject = void 0;
const prisma_client_1 = __importDefault(require("../../prisma-client"));
const getUserProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    try {
        const userRepls = yield prisma_client_1.default.user.findUnique({
            where: { id: userId },
            include: {
                repls: {
                    orderBy: { createdAt: 'desc' }, // Sort by creation date (newest first)
                    take: 7, // Limit to the 7 most recent repls
                    select: {
                        title: true, // Fetch the title
                        id: true, // Include the ID
                    },
                },
            },
        });
        if (!userRepls) {
            return res.status(404).json({ message: 'User not found' });
        }
        const recentProjects = userRepls.repls.map((repl) => ({
            title: repl.title,
            replId: repl.id,
        }));
        res.status(200).json({
            message: 'Recent projects fetched successfully',
            userId: userId,
            recentProjects,
        });
    }
    catch (err) {
        console.log('Internal server error', err);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
});
exports.getUserProject = getUserProject;
