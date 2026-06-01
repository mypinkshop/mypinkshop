const csv = require('csv-parser');
const { Readable } = require('stream');
const Product = require('../models/Product');

const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const bulkUploadProducts = async (req, res) => {
  try {
    const userRole = req.body.role; // 'admin' or 'vendor'
    const vendorId = req.user?.vendorId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // CSV parse kar
    const products = await parseCSV(req.file.buffer);
    
    let added = 0;
    let failed = 0;
    const failedProducts = [];
    
    for (const product of products) {
      try {
        const newProduct = new Product({
          name: product['Product Name'],
          brand: product.Brand,
          category: product.SubCategory,
          mainCategory: product.Category,
          price: parseFloat(product['Selling Price']),
          stock: parseInt(product.Stock),
          description: product['Description Bullets (Use | symbol)']?.split('|') || [],
          vendorId: userRole === 'vendor' ? vendorId : null,
          adminApproved: userRole === 'admin',
          status: userRole === 'admin' ? 'active' : 'pending',
          sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          images: []
        });
        
        await newProduct.save();
        added++;
      } catch (error) {
        failed++;
        failedProducts.push({ product, error: error.message });
      }
    }
    
    res.json({ 
      added, 
      failed, 
      failedProducts,
      message: `${added} products added successfully`
    });
    
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { bulkUploadProducts };
