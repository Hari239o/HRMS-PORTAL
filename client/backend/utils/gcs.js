const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { randomUUID } = require('crypto');

const uuidv4 = randomUUID;
const storageOptions = {};
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  try {
    storageOptions.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  } catch (e) {
    console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON');
  }
}
const storage = new Storage(storageOptions);
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'geonixa-hrms-uploads';

/**
 * Uploads a file stream directly to Google Cloud Storage
 * @param {Object} file - The file object from Multer (memoryStorage)
 * @param {string} folder - The destination folder in the bucket
 * @returns {Promise<string>} - The GCS Path (gcs://bucket/file)
 */
const uploadStreamToGCS = (file, folder = 'general') => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided for GCS upload'));
    }

    const bucket = storage.bucket(BUCKET_NAME);
    const ext = path.extname(file.originalname);
    const filename = `${folder}/${Date.now()}-${uuidv4()}${ext}`;
    const blob = bucket.file(filename);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    blobStream.on('error', (err) => {
      console.error('Error during GCS stream upload:', err);
      reject(err);
    });

    blobStream.on('finish', () => {
      // Return a structured path rather than a direct URL to enforce Signed URL generation
      const gcsPath = `gcs://${BUCKET_NAME}/${filename}`;
      resolve(gcsPath);
    });

    blobStream.end(file.buffer);
  });
};

/**
 * Generates a signed URL for secure file access
 * @param {string} gcsPath - The gcs:// formatted path
 * @param {number} expiresInMinutes - Expiration time
 * @returns {Promise<string>} - The signed URL
 */
const generateSignedUrl = async (gcsPath, expiresInMinutes = 60) => {
  if (!gcsPath || !gcsPath.startsWith('gcs://')) {
    return gcsPath; // Return as-is if it's already a standard URL (legacy)
  }

  try {
    const withoutPrefix = gcsPath.replace('gcs://', '');
    const [bucketName, ...fileParts] = withoutPrefix.split('/');
    const filename = fileParts.join('/');

    const options = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    };

    const [url] = await storage.bucket(bucketName).file(filename).getSignedUrl(options);
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

/**
 * Deletes a file from GCS
 * @param {string} gcsPath - The gcs:// formatted path
 */
const deleteFromGCS = async (gcsPath) => {
  if (!gcsPath || !gcsPath.startsWith('gcs://')) return;

  try {
    const withoutPrefix = gcsPath.replace('gcs://', '');
    const [bucketName, ...fileParts] = withoutPrefix.split('/');
    const filename = fileParts.join('/');

    await storage.bucket(bucketName).file(filename).delete();
  } catch (error) {
    console.error('Error deleting from GCS:', error);
  }
};

module.exports = {
  storage,
  uploadStreamToGCS,
  generateSignedUrl,
  deleteFromGCS,
};
