// backend/config/shiprocketConfig.js

require('dotenv').config();

module.exports = {
  // Shiprocket API
  API_URL: process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external',
  EMAIL: process.env.SHIPROCKET_EMAIL,
  PASSWORD: process.env.SHIPROCKET_PASSWORD,
  
  // Store Defaults
  STORE_PINCODE: process.env.STORE_PINCODE || '110001',
  STORE_PICKUP_LOCATION: process.env.STORE_PICKUP_LOCATION || 'Primary',
  
  // Default dimensions
  DEFAULT_WEIGHT: 0.5,     // kg
  DEFAULT_LENGTH: 20,      // cm
  DEFAULT_WIDTH: 15,       // cm
  DEFAULT_HEIGHT: 10,      // cm
  
  // Order defaults
  DEFAULT_COUNTRY: 'India',
  DEFAULT_PAYMENT_METHOD: 'COD',
  
  // Courier partners
  COURIERS: {
    STANDARD: 'Standard',
    EXPRESS: 'Express',
    NIGHT: 'Night',
    SURFACE: 'Surface',
    DOMESTIC: 'Domestic'
  }
};
