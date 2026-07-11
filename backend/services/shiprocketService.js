// backend/services/shiprocketService.js

const { shiprocketRequest } = require('../utils/shiprocketAuth');
const config = require('../config/shiprocketConfig');

/**
 * 1. Check serviceability for vendor
 */
const checkServiceability = async (pickupPincode, deliveryPincode, weight = config.DEFAULT_WEIGHT) => {
  try {
    const response = await shiprocketRequest(
      'GET',
      '/courier/serviceability',
      null,
      {
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight: weight
      }
    );
    
    const couriers = response.data?.available_courier_companies || [];
    const deliverable = couriers.length > 0;
    
    return {
      success: true,
      deliverable,
      couriers: couriers,
      message: deliverable 
        ? 'Delivery available to this pincode' 
        : 'Delivery not available to this pincode'
    };
  } catch (error) {
    console.error('Serviceability check error:', error.response?.data || error.message);
    return {
      success: false,
      deliverable: false,
      couriers: [],
      message: error.response?.data?.message || 'Unable to check delivery'
    };
  }
};

/**
 * 2. Get shipping rates
 */
const getShippingRates = async (pickupPincode, deliveryPincode, weight = config.DEFAULT_WEIGHT) => {
  try {
    const response = await shiprocketRequest(
      'POST',
      '/courier/rate',
      {
        pickup_postcode: pickupPincode,
        delivery_postcode: deliveryPincode,
        weight: weight,
        length: config.DEFAULT_LENGTH,
        breadth: config.DEFAULT_WIDTH,
        height: config.DEFAULT_HEIGHT
      }
    );
    
    return {
      success: true,
      rates: response.data?.shipping_charges || 0,
      estimated_days: response.data?.estimated_days || 3,
      courier: response.data?.courier_company_id || null,
      courier_name: response.data?.courier_company_name || 'Standard'
    };
  } catch (error) {
    console.error('Rate calculation error:', error.response?.data || error.message);
    return {
      success: false,
      rates: 0,
      estimated_days: 5,
      message: error.response?.data?.message || 'Unable to calculate shipping rates'
    };
  }
};

/**
 * 3. Create order in Shiprocket
 */
const createShiprocketOrder = async (orderData) => {
  try {
    const payload = {
      order_id: orderData.orderId,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: orderData.pickupLocation || config.STORE_PICKUP_LOCATION,
      
      // Billing Details
      billing_customer_name: orderData.billingName,
      billing_address: orderData.billingAddress,
      billing_city: orderData.billingCity,
      billing_pincode: orderData.billingPincode,
      billing_state: orderData.billingState,
      billing_country: orderData.billingCountry || config.DEFAULT_COUNTRY,
      billing_email: orderData.email,
      billing_phone: orderData.phone,
      
      // Shipping Details
      shipping_customer_name: orderData.shippingName || orderData.billingName,
      shipping_address: orderData.shippingAddress || orderData.billingAddress,
      shipping_city: orderData.shippingCity || orderData.billingCity,
      shipping_pincode: orderData.shippingPincode || orderData.billingPincode,
      shipping_state: orderData.shippingState || orderData.billingState,
      shipping_country: orderData.shippingCountry || config.DEFAULT_COUNTRY,
      shipping_email: orderData.email,
      shipping_phone: orderData.phone,
      
      // Items
      order_items: orderData.items.map(item => ({
        name: item.name,
        sku: item.sku || item.id || 'SKU001',
        units: item.quantity,
        selling_price: item.price,
        discount: item.discount || 0,
        tax: item.tax || 0,
        hsn: item.hsn || '0000'
      })),
      
      // Payment
      payment_method: orderData.paymentMethod || config.DEFAULT_PAYMENT_METHOD,
      total_discount: orderData.discount || 0,
      sub_total: orderData.subTotal,
      
      // Dimensions
      length: orderData.length || config.DEFAULT_LENGTH,
      breadth: orderData.breadth || config.DEFAULT_WIDTH,
      height: orderData.height || config.DEFAULT_HEIGHT,
      weight: orderData.weight || config.DEFAULT_WEIGHT,
      
      // ✅ Pickup pincode (vendor specific)
      pickup_postcode: orderData.vendorPincode || config.STORE_PINCODE
    };

    const response = await shiprocketRequest(
      'POST',
      '/orders/create/adhoc',
      payload
    );

    return {
      success: true,
      shipmentId: response.data?.shipment_id,
      orderId: response.data?.order_id,
      awb: response.data?.awb_code,
      courier: response.data?.courier_company_id,
      courierName: response.data?.courier_company_name,
      labelUrl: response.data?.label_url,
      message: 'Order created in Shiprocket'
    };
  } catch (error) {
    console.error('Shiprocket order creation error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create order in Shiprocket'
    };
  }
};

/**
 * 4. Generate AWB
 */
const generateAWB = async (orderId) => {
  try {
    const response = await shiprocketRequest(
      'POST',
      '/orders/awb/generate',
      { order_id: orderId }
    );

    return {
      success: true,
      awb: response.data?.awb_code,
      courier: response.data?.courier_company_id,
      courierName: response.data?.courier_company_name
    };
  } catch (error) {
    console.error('AWB generation error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to generate AWB'
    };
  }
};

/**
 * 5. Get tracking details
 */
const getTrackingDetails = async (orderId) => {
  try {
    const response = await shiprocketRequest(
      'GET',
      `/orders/tracking?order_id=${orderId}`
    );

    return {
      success: true,
      status: response.data?.order_status || 'unknown',
      tracking: response.data?.tracking_data || [],
      awb: response.data?.awb_code,
      courier: response.data?.courier_company_name
    };
  } catch (error) {
    console.error('Tracking error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to get tracking details'
    };
  }
};

/**
 * 6. Cancel order
 */
const cancelShiprocketOrder = async (orderId) => {
  try {
    const response = await shiprocketRequest(
      'POST',
      '/orders/cancel',
      { order_id: orderId }
    );

    return {
      success: true,
      message: response.data?.message || 'Order cancelled successfully'
    };
  } catch (error) {
    console.error('Order cancellation error:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to cancel order'
    };
  }
};

module.exports = {
  checkServiceability,
  getShippingRates,
  createShiprocketOrder,
  generateAWB,
  getTrackingDetails,
  cancelShiprocketOrder
};
