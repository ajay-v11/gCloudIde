import {Storage} from '@google-cloud/storage';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET ?? 'cloud-user-codes';

export const saveToGCS = async (
  key: string,
  filePath: string,
  content: string
): Promise<void> => {
  try {
    const bucket = storage.bucket(bucketName);
    const fullPath = `${key}${filePath}`;
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
    throw error;
  }
};
