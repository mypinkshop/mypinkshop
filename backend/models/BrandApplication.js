const mongoose = require('mongoose');

const brandApplicationSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  brandName: { type: String, required: true },
  trademarkNumber: { type: String, required: true },
  trademarkOffice: { type: String, default: 'india' },
  brandWebsite: { type: String, default: '' },
  productCategories: { type: [String], default: [] },
  manufacturingCountries: { type: [String], default: [] },
  brandCertificate: { type: String, default: '' },
  brandLogo: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminRemarks: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const BrandApplication = mongoose.models.BrandApplication || mongoose.model('BrandApplication', brandApplicationSchema);
module.exports = BrandApplication;
