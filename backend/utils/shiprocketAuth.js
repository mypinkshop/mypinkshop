// backend/utils/shiprocketAuth.js

const axios = require('axios');
const config = require('../config/shiprocketConfig');

let cachedToken = null;
let tokenExpiry = null;

/**
 * Generate Shiprocket Auth Token
 */
const generateToken = async () => {
  try {
    console.log('🔑 Generating Shiprocket token...');
    
    const response = await axios.post(`${config.API_URL}/auth/login`, {
      email: config.EMAIL,
      password: config.PASSWORD
    });

    if (response.data && response.data.token) {
      cachedToken = response.data.token;
      tokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23 hours
      console.log('✅ Shiprocket token generated successfully');
      return cachedToken;
    } else {
      throw new Error('Failed to get token from Shiprocket');
    }
  } catch (error) {
    console.error('❌ Shiprocket token error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Shiprocket');
  }
};

/**
 * Get valid token (cached or new)
 */
const getToken = async () => {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  return await generateToken();
};

/**
 * Make authenticated request to Shiprocket
 */
const shiprocketRequest = async (method, endpoint, data = null, params = null) => {
  const token = await getToken();
  
  const options = {
    method: method,
    url: `${config.API_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) options.data = data;
  if (params) options.params = params;

  try {
    const response = await axios(options);
    return response.data;
  } catch (error) {
    // If token expired, retry with new token
    if (error.response?.status === 401) {
      console.log('🔄 Token expired, refreshing...');
      cachedToken = null;
      tokenExpiry = null;
      
      const newToken = await generateToken();
      options.headers.Authorization = `Bearer ${newToken}`;
      
      const retryResponse = await axios(options);
      return retryResponse.data;
    }
    
    console.error('❌ Shiprocket API error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = {
  generateToken,
  getToken,
  shiprocketRequest
};
