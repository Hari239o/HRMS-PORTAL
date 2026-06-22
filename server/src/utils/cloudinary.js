const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

let upload, uploadDocument;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'attendance_photos',
      format: async (req, file) => 'jpg',
      public_id: (req, file) => `${Date.now()}-${req.user?.id || 'unknown'}`
    }
  });

  const documentStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'employee_documents',
      resource_type: 'auto',
      public_id: (req, file) => `${Date.now()}-${req.user?.id || 'doc'}`
    }
  });

  upload = multer({ storage: storage });
  uploadDocument = multer({ storage: documentStorage });
} else {
  // Local storage fallback
  const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  const uploadsDir = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (err) {
    console.warn('Failed to create uploads directory (expected in Vercel):', err.message);
  }

  const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${req.user?.id || 'unknown'}${ext}`)
    }
  });

  upload = multer({ storage: localStorage });
  uploadDocument = multer({ storage: localStorage });
}

module.exports = { cloudinary, upload, uploadDocument };
