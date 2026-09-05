import { Hono } from 'hono';
import {
  createOTP,
  getOTPByEmail,
  isValidOTP,
  verifyOTP,
  deleteOTP
} from '../models/OTP.js';

const otp = new Hono();

// ========== CREATE OTP ==========
otp.post('/create', async (c) => {
  try {
    const { email, phone, otp, type } = await c.req.json();

    if (!email) {
      return c.json({ success: false, message: 'Email is required' }, 400);
    }

    const otpId = await createOTP(c.env.DB, {
      email,
      phone: phone || '',
      otp,
      type: type || 'email'
    });

    return c.json({ success: true, otpId });
  } catch (error) {
    console.error('Create OTP error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== CHECK OTP VALIDITY ==========
otp.post('/verify', async (c) => {
  try {
    const { email, otp, type } = await c.req.json();

    if (!email || !otp) {
      return c.json({ success: false, message: 'Email and OTP are required' }, 400);
    }

    const result = await isValidOTP(c.env.DB, email, otp, type || 'email');

    if (!result.valid) {
      return c.json({ success: false, message: result.message });
    }

    return c.json({ success: true, message: 'OTP is valid' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== VERIFY OTP ==========
otp.post('/verify-otp', async (c) => {
  try {
    const { email, otp, type } = await c.req.json();

    if (!email || !otp) {
      return c.json({ success: false, message: 'Email and OTP are required' }, 400);
    }

    const result = await verifyOTP(c.env.DB, email, otp, type || 'email');

    if (!result.success) {
      return c.json({ success: false, message: result.message });
    }

    return c.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== GET OTP BY EMAIL ==========
otp.get('/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const otpData = await getOTPByEmail(c.env.DB, email);

    if (!otpData) {
      return c.json({ success: false, message: 'OTP not found' }, 404);
    }

    return c.json({ success: true, otpData });
  } catch (error) {
    console.error('Get OTP error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ========== DELETE OTP ==========
otp.delete('/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const result = await deleteOTP(c.env.DB, email);

    if (!result) {
      return c.json({ success: false, message: 'OTP not found' }, 404);
    }

    return c.json({ success: true, message: 'OTP deleted successfully' });
  } catch (error) {
    console.error('Delete OTP error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default otp;
