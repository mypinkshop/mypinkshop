const express = require('express');
const multer = require('multer');
const { bulkUploadProducts } = require('../controllers/bulkUploadController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Bulk upload endpoint (CSV file accept karega)
router.post('/bulk-upload', authenticate, upload.single('file'), bulkUploadProducts);

module.exports = router;
