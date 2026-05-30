const AWS = require('aws-sdk');
const multer = require('multer');

// Configure R2
const s3 = new AWS.S3({
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: 'auto',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Multer setup (memory storage for file uploads)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// Upload single image to R2
const uploadToR2 = async (file, folder = 'products') => {
  try {
    const extension = file.originalname.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000' // 1 year cache
    };
    
    const result = await s3.upload(params).promise();
    return {
      success: true,
      url: `${PUBLIC_URL}/${fileName}`,
      key: fileName
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return { success: false, error: error.message };
  }
};

// Upload multiple images to R2
const uploadMultipleToR2 = async (files, folder = 'products') => {
  const results = [];
  for (const file of files) {
    const result = await uploadToR2(file, folder);
    results.push(result);
  }
  return results;
};

// Delete image from R2
const deleteFromR2 = async (key) => {
  try {
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key
    }).promise();
    return { success: true };
  } catch (error) {
    console.error('R2 delete error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  upload,
  uploadToR2,
  uploadMultipleToR2,
  deleteFromR2
};
