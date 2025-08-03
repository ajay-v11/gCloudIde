import {Storage} from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
});

const bucketName = process.env.GCS_BUCKET ?? '';
console.log('the bucketname is', process.env.GCS_BUCKET);

export const copyGCSFolder = async (
  sourceFolderPath: string,
  destinationFolderPath: string
) => {
  try {
    // Get bucket from environment variable
    const bucket = storage.bucket(process.env.GCS_BUCKET || '');

    // List objects in the source folder
    const [files, nextQuery] = await bucket.getFiles({
      prefix: sourceFolderPath,
    });

    console.log(sourceFolderPath);
    console.log(destinationFolderPath);

    // Copy each file
    await Promise.all(
      files.map(async (file) => {
        const destinationKey = file.name.replace(
          sourceFolderPath,
          destinationFolderPath
        );
        const destinationFile = bucket.file(destinationKey);

        await file.copy(destinationFile);
        console.log(`Copied ${file.name} to ${destinationKey}`);
      })
    );

    // Handle pagination
    if (nextQuery.pageToken) {
      await copyGCSFolder(sourceFolderPath, destinationFolderPath);
    }
  } catch (error) {
    console.error('Error copying folder:', error);
    throw error;
  }
};
