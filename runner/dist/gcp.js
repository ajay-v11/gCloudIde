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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileExistsInGCS = exports.saveToGCS = void 0;
const storage_1 = require("@google-cloud/storage");
const path_1 = __importDefault(require("path"));
const storage = new storage_1.Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: path_1.default.resolve(__dirname, '../cloud-ide-444818-252a2cd444a0.json'), // Path to your GCP service account key
});
const bucketName = (_a = process.env.GCS_BUCKET) !== null && _a !== void 0 ? _a : '';
const saveToGCS = (key, filePath, content) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const bucketName = (_a = process.env.GCS_BUCKET) !== null && _a !== void 0 ? _a : '';
        const bucket = storage.bucket(bucketName);
        const fullPath = `${key}${filePath}`;
        const file = bucket.file(fullPath);
        // Upload the content
        yield file.save(content, {
            contentType: 'text/plain', // Adjust based on your content type
            metadata: {
                cacheControl: 'public, max-age=31536000',
            },
        });
        console.log(`Successfully uploaded to ${fullPath}`);
    }
    catch (error) {
        console.error('Error uploading to GCS:', error);
        throw error;
    }
});
exports.saveToGCS = saveToGCS;
// Optional: Helper function to check if file exists
const fileExistsInGCS = (key, filePath) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const bucketName = (_a = process.env.GCS_BUCKET) !== null && _a !== void 0 ? _a : '';
    const bucket = storage.bucket(bucketName);
    const fullPath = `code/${key}${filePath}`;
    const file = bucket.file(fullPath);
    const [exists] = yield file.exists();
    return exists;
});
exports.fileExistsInGCS = fileExistsInGCS;
