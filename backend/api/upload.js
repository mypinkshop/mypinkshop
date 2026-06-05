const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure AWS for Cloudflare R2
const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'auto',
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-f5e8a3a9b1c24d8e9f7a6b5c4d3e2f1a.r2.dev';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  },
});

// ============ SINGLE IMAGE UPLOAD ============
router.post('/', upload.single('images'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = req.file.originalname.split('.').pop();
    const filename = `products/${timestamp}-${randomString}.${fileExtension}`;

    // Upload to Cloudflare R2
    const params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read',
    };

    const uploadResult = await s3.upload(params).promise();
    
    // Return public URL
    const imageUrl = `${PUBLIC_URL}/${filename}`;

    res.json({
      success: true,
      url: imageUrl,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ MULTIPLE IMAGES UPLOAD ============
router.post('/multiple', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedUrls = [];

    for (const file of req.files) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const filename = `products/${timestamp}-${randomString}.${fileExtension}`;

      const params = {
        Bucket: BUCKET_NAME,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      };

      await s3.upload(params).promise();
      const imageUrl = `${PUBLIC_URL}/${filename}`;
      uploadedUrls.push(imageUrl);
    }

    res.json({
      success: true,
      urls: uploadedUrls,
      message: `${uploadedUrls.length} images uploaded successfully`,
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ DELETE IMAGE ============
router.delete('/', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' });
    }

    // Extract filename from URL
    const filename = imageUrl.split('/').pop();
    const params = {
      Bucket: BUCKET_NAME,
      Key: `products/${filename}`,
    };

    await s3.deleteObject(params).promise();

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
