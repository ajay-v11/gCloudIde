import {Storage} from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: path.resolve(__dirname, '../cloud-ide-444818-252a2cd444a0.json'), // Path to your GCP service account key
});

const bucketName = process.env.GCS_BUCKET ?? '';

export const saveToGCS = async (
  key: string,
  filePath: string,
  content: string
): Promise<void> => {
  try {
    const bucketName = process.env.GCS_BUCKET ?? '';
    const bucket = storage.bucket(bucketName);
    const fullPath = `${key}${filePath}`;
    const file = bucket.file(fullPath);

    // Upload the content
    await file.save(content, {
      contentType: 'text/plain', // Adjust based on your content type
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

// Optional: Helper function to check if file exists
export const fileExistsInGCS = async (
  key: string,
  filePath: string
): Promise<boolean> => {
  const bucketName = process.env.GCS_BUCKET ?? '';
  const bucket = storage.bucket(bucketName);
  const fullPath = `code/${key}${filePath}`;
  const file = bucket.file(fullPath);

  const [exists] = await file.exists();
  return exists;
};
