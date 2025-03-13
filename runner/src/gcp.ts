import {Storage} from '@google-cloud/storage';
import path from 'path';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET ?? 'cloud-user-codes';

export const saveToGCS = async (
  key: string,
  filePath: string,
  content: string
): Promise<void> => {
  try {
    const bucket = storage.bucket(bucketName);

    // Extract just the filename from the path
    const fileName = path.basename(filePath);
    const fullPath = `${key}/${fileName}`;

    const file = bucket.file(fullPath);

    await file.save(content, {
      contentType: 'text/plain',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    console.log(`Successfully uploaded to ${fullPath}`);
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    // Log error but don't throw it to prevent crashing
    // Only throw if you have proper error handling upstream
  }
};
