// src/utils/shipping.js

const API_URL = process.env.REACT_APP_API_URL || 'https://api.mypinkshop.com';

/**
 * Check delivery availability for a pincode
 */
export const checkDelivery = async (deliveryPincode, vendorPincode, weight = 0.5) => {
  try {
    const response = await fetch(`${API_URL}/api/shipping/check-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deliveryPincode,
        vendorPincode,
        weight
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Delivery check error:', error);
    return {
      success: false,
      deliverable: false,
      message: 'Failed to check delivery'
    };
  }
};

/**
 * Get shipping rates for a pincode
 */
export const getShippingRates = async (pickupPincode, deliveryPincode, weight = 0.5) => {
  try {
    const response = await fetch(`${API_URL}/api/shipping/shipping-rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pickupPincode,
        deliveryPincode,
        weight
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Shipping rates error:', error);
    return {
      success: false,
      rates: 0,
      message: 'Failed to get shipping rates'
    };
  }
};

/**
 * Create Shiprocket order (from checkout)
 */
export const createShippingOrder = async (orderData, token) => {
  try {
    const response = await fetch(`${API_URL}/api/shipping/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create shipping order error:', error);
    return {
      success: false,
      message: 'Failed to create shipping order'
    };
  }
};

/**
 * Get tracking details for an order
 */
export const getTrackingDetails = async (orderId, token) => {
  try {
    const response = await fetch(`${API_URL}/api/shipping/tracking/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Tracking error:', error);
    return {
      success: false,
      message: 'Failed to get tracking details'
    };
  }
};

/**
 * Admin: Generate AWB
 */
export const generateAWB = async (orderId, token) => {
  try {
    const response = await fetch(`${API_URL}/api/shipping/generate-awb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderId })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AWB generation error:', error);
    return {
      success: false,
      message: 'Failed to generate AWB'
    };
  }
};

/**
 * Admin: Cancel Shiprocket order
 */
export const cancelShippingOrder = async (orderId, token) => {
  try {
    const response = await fetch(`${API_URL}/api/shipping/cancel-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ orderId })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Cancel shipping order error:', error);
    return {
      success: false,
      message: 'Failed to cancel shipping order'
    };
  }
};

/**
 * Helper: Format shipping date
 */
export const formatDeliveryDate = (days) => {
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + days);
  
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return deliveryDate.toLocaleDateString('en-IN', options);
};

/**
 * Helper: Get delivery date range
 */
export const getDeliveryDateRange = (minDays, maxDays) => {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + minDays);
  
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + maxDays);
  
  const options = { day: 'numeric', month: 'short' };
  
  return {
    minDate: minDate.toLocaleDateString('en-IN', options),
    maxDate: maxDate.toLocaleDateString('en-IN', options)
  };
};
