const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🔥 Bulk upload route (IMPORT)
const bulkUploadRoutes = require('./routes/bulkUploadRoutes');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bulk-upload', bulkUploadRoutes);  
app.use('/api/offers', require('./routes/offerRoutes'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'MyPinkShop API is running 🎀' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
