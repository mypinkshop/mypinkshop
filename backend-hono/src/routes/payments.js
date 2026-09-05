import { Hono } from 'hono';
import { createPayment, getPaymentByOrderId, updatePaymentStatus, updatePaymentStatus as updateOrderPaymentStatus } from '../db/queries.js';

const payments = new Hono();

// Webhook endpoint for payment gateway
payments.post('/webhook', async (c) => {
  const { payment_id, order_id, status, amount } = await c.req.json();
  
  // Check if payment already exists
  const existing = await getPaymentByOrderId(c.env, order_id);
  if (existing) {
    await updatePaymentStatus(c.env, payment_id, status);
  } else {
    await createPayment(c.env, { order_id, payment_id, status, amount });
  }
  
  // Update order payment status
  if (status === 'paid') {
    await updateOrderPaymentStatus(c.env, order_id, 'paid');
  } else if (status === 'failed') {
    await updateOrderPaymentStatus(c.env, order_id, 'failed');
  }
  
  return c.json({ success: true });
});

export default payments;
