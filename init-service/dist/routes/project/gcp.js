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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyGCSFolder = void 0;
const storage_1 = require("@google-cloud/storage");
const storage = new storage_1.Storage({
    projectId: process.env.GCP_PROJECT_ID,
});
const bucketName = (_a = process.env.GCS_BUCKET) !== null && _a !== void 0 ? _a : '';
console.log('the bucketname is', process.env.GCS_BUCKET);
const copyGCSFolder = (sourceFolderPath, destinationFolderPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get bucket from environment variable
        const bucket = storage.bucket(process.env.GCS_BUCKET || '');
        // List objects in the source folder
        const [files, nextQuery] = yield bucket.getFiles({
            prefix: sourceFolderPath,
        });
        console.log(sourceFolderPath);
        console.log(destinationFolderPath);
        // Copy each file
        yield Promise.all(files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const destinationKey = file.name.replace(sourceFolderPath, destinationFolderPath);
            const destinationFile = bucket.file(destinationKey);
            yield file.copy(destinationFile);
            console.log(`Copied ${file.name} to ${destinationKey}`);
        })));
        // Handle pagination
        if (nextQuery.pageToken) {
            yield (0, exports.copyGCSFolder)(sourceFolderPath, destinationFolderPath);
        }
    }
    catch (error) {
        console.error('Error copying folder:', error);
        throw error;
    }
});
exports.copyGCSFolder = copyGCSFolder;
