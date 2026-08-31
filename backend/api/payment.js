// backend/api/payment.js
const express = require('express');
const router = express.Router();
const { StandardCheckoutClient, Env } = require('@phonepe-pg/pg-sdk-node');

// PhonePe Client Initialize karo
const client = StandardCheckoutClient.getInstance(
  process.env.PHONEPE_CLIENT_ID, 
  process.env.PHONEPE_CLIENT_SECRET, 
  parseInt(process.env.PHONEPE_VERSION || '1'), 
  Env.SANDBOX // Production mein Env.PRODUCTION karna hoga
);

// Payment Initiate API
router.post('/initiate', async (req, res) => {
  try {
    const { amount } = req.body; // Amount in Rupees
    const { randomUUID } = require('crypto');

    const merchantOrderId = randomUUID();
    const redirectUrl = `${req.protocol}://${req.get('host')}/payment-success`; // Frontend ka success page

    // Amount ko paise mein convert karo (₹1 = 100 paise)
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount * 100) 
      .redirectUrl(redirectUrl)
      .build();

    const response = await client.pay(request);
    
    // Frontend ko redirect URL bhejo
    res.json({ 
      success: true, 
      redirectUrl: response.redirectUrl,
      merchantOrderId 
    });

  } catch (error) {
    console.error('Payment Initiation Error:', error);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
});

// Payment Status Check API
router.get('/status/:merchantOrderId', async (req, res) => {
  try {
    const { merchantOrderId } = req.params;
    const response = await client.getOrderStatus(merchantOrderId);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error('Status Check Error:', error);
    res.status(500).json({ success: false, message: 'Status fetch failed' });
  }
});

module.exports = router;
