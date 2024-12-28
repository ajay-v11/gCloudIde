import {Storage} from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: path.resolve(
    __dirname,
    '../../../cloud-ide-444818-252a2cd444a0.json'
  ), // Path to your GCP service account key
});

const bucketName = process.env.GCS_BUCKET ?? '';

export async function copyGCSFolder(
  sourcePrefix: string,
  destinationPrefix: string,
  pageToken?: string
): Promise<void> {
  try {
    // List objects in the source folder
    const [files, nextQuery] = await storage.bucket(bucketName).getFiles({
      prefix: sourcePrefix,
      pageToken,
    });

    console.log(sourcePrefix);
    console.log(destinationPrefix);

    // Copy each file
    await Promise.all(
      files.map(async (file) => {
        const destinationKey = file.name.replace(
          sourcePrefix,
          destinationPrefix
        );
        const destinationFile = storage.bucket(bucketName).file(destinationKey);

        await file.copy(destinationFile);
        console.log(`Copied ${file.name} to ${destinationKey}`);
      })
    );

    // Handle pagination
    if (nextQuery.pageToken) {
      await copyGCSFolder(sourcePrefix, destinationPrefix, nextQuery.pageToken);
    }
  } catch (error) {
    console.error('Error copying folder:', error);
  }
}
