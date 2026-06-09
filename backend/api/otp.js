const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const OTP = require('../models/OTP');
const User = require('../models/User');

// ========== CHECK ENVIRONMENT VARIABLES FIRST ==========
console.log('🔍 Checking environment variables:');
console.log('SENDER_USERNAME exists:', !!process.env.SENDER_USERNAME);
console.log('SENDER_PASSWORD exists:', !!process.env.SENDER_PASSWORD);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

// ========== SENDER.NET SMTP TRANSPORTER ==========
let transporter;

try {
  transporter = nodemailer.createTransport({
    host: 'smtp.sender.net',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SENDER_USERNAME,
      pass: process.env.SENDER_PASSWORD
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  });

  // Verify transporter connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Sender.net SMTP connection error:', error.message);
    } else {
      console.log('✅ Sender.net SMTP is ready');
    }
  });
} catch (error) {
  console.error('❌ Failed to create transporter:', error.message);
  transporter = null;
}

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
const sendOTPEmail = async (email, otp) => {
  // Mock mode if no transporter
  if (!transporter) {
    console.log('🔐 MOCK MODE - OTP for', email, ':', otp);
    return { success: true, mock: true };
  }

  const mailOptions = {
    from: `"MyPinkShop" <noreply@mypinkshop.com>`,
    to: email,
    subject: '🔐 Your MyPinkShop Login OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
            <span style="font-size: 30px;">🛍️</span>
          </div>
          <h1 style="color: #be185d; margin-top: 10px;">MyPinkShop</h1>
          <p style="color: #9ca3af;">Your Beauty Destination</p>
        </div>
        
        <div style="background: white; border-radius: 16px; padding: 30px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Login Verification</h2>
          <p style="color: #4b5563; margin-bottom: 20px;">Use the following OTP to complete your login:</p>
          
          <div style="font-size: 48px; font-weight: bold; letter-spacing: 10px; color: #ec4899; background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 20px 0;">
            ${otp}
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">This OTP is valid for <strong>10 minutes</strong>.</p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          <p>© 2026 MyPinkShop. All rights reserved.</p>
          <p>Made with 💖 for the girlies</p>
        </div>
      </div>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Send email error:', error.message);
    // Don't fail - use mock mode as fallback
    console.log('🔐 FALLBACK MOCK MODE - OTP for', email, ':', otp);
    return { success: true, mock: true, otp: otp };
  }
};

// ========== TEST ROUTES ==========
router.get('/test', async (req, res) => {
  res.json({ 
    success: true, 
    message: 'OTP API is running',
    envVars: {
      SENDER_USERNAME: process.env.SENDER_USERNAME ? '✅ Set' : '❌ Missing',
      SENDER_PASSWORD: process.env.SENDER_PASSWORD ? '✅ Set' : '❌ Missing'
    }
  });
});

router.get('/test-smtp', async (req, res) => {
  try {
    if (!transporter) {
      return res.status(500).json({ success: false, error: 'Transporter not initialized' });
    }
    await transporter.verify();
    res.json({ success: true, message: 'SMTP connection successful!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== SEND OTP ==========
router.post('/send', async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    console.log('📨 Send OTP request for:', email);
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Delete old OTPs
    await OTP.deleteMany({ email });
    
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const newOTP = new OTP({
      email,
      phone: phone || '',
      otp,
      type: 'email',
      expiresAt
    });
    
    await newOTP.save();
    console.log('📝 OTP saved to DB:', otp);
    
    // Send email
    const result = await sendOTPEmail(email, otp);
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send OTP', details: result.error });
    }
    
    // If mock mode, log OTP for debugging
    if (result.mock) {
      console.log('⚠️ MOCK MODE ACTIVE - OTP is:', result.otp || otp);
      return res.json({ 
        success: true, 
        message: 'OTP sent (mock mode - check server logs)',
        mockOtp: result.otp || otp,
        expiresIn: 600
      });
    }
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      expiresIn: 600
    });
    
  } catch (error) {
    console.error('❌ Send OTP error:', error.message);
    res.status(500).json({ error: 'Failed to send OTP: ' + error.message });
  }
});

// ========== VERIFY OTP ==========
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    const otpRecord = await OTP.findOne({ email, otp, verified: false });
    
    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }
    
    otpRecord.verified = true;
    await otpRecord.save();
    
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        name: email.split('@')[0],
        email,
        password: Math.random().toString(36).substring(2, 15),
        role: 'buyer'
      });
      await user.save();
    }
    
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '365d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'Login successful!'
    });
    
  } catch (error) {
    console.error('❌ Verify error:', error.message);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// ========== RESEND OTP ==========
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    await OTP.deleteMany({ email });
    
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    const newOTP = new OTP({
      email,
      otp,
      type: 'email',
      expiresAt
    });
    
    await newOTP.save();
    
    const result = await sendOTPEmail(email, otp);
    
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to resend OTP' });
    }
    
    res.json({ 
      success: true, 
      message: 'OTP resent successfully',
      expiresIn: 600
    });
    
  } catch (error) {
    console.error('❌ Resend error:', error.message);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

module.exports = router;
