const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const OTP = require('../models/OTP');
const User = require('../models/User');

// ========== ZOHO MAIL TRANSPORTER CONFIGURATION ==========
// Free plan ke liye: host 'smtp.zoho.com', port 587, secure false
// Paid plan ke liye: host 'smtppro.zoho.com', port 465, secure true

const transporter = nodemailer.createTransport({
  host: process.env.ZOHO_HOST || 'smtppro.zoho.com',  // smtp.zoho.com for free
  port: process.env.ZOHO_PORT || 465,                  // 587 for free plan
  secure: process.env.ZOHO_SECURE === 'true' || true,  // false for free plan
  auth: {
    user: process.env.ZOHO_USER,      // info@myinkshop.com
    pass: process.env.ZOHO_PASSWORD    // App specific password
  },
  tls: {
    rejectUnauthorized: false  // SSL issues ke liye
  }
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Zoho SMTP connection error:', error);
  } else {
    console.log('Zoho SMTP is ready to send emails');
  }
});

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email using noreply@myinkshop.com
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.ZOHO_FROM_EMAIL || 'noreply@myinkshop.com',  // noreply alias
    to: email,
    subject: 'Your MyPinkShop Login OTP',
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
          
          <p style="color: #6b7280; font-size: 14px;">This OTP is valid for 10 minutes.</p>
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
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Send email error:', error);
    throw error;
  }
};

// ========== SEND OTP ==========
router.post('/send', async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Delete existing OTPs for this email
    await OTP.deleteMany({ email });
    
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const newOTP = new OTP({
      email,
      phone: phone || '',
      otp,
      type: 'email',
      expiresAt
    });
    
    await newOTP.save();
    
    // Send OTP via email
    await sendOTPEmail(email, otp);
    
    res.json({ 
      success: true, 
      message: 'OTP sent to your email address',
      expiresIn: 600 // 10 minutes in seconds
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    
    // Handle specific nodemailer errors
    if (error.code === 'EAUTH') {
      return res.status(500).json({ error: 'Email authentication failed. Check Zoho credentials.' });
    }
    if (error.code === 'ECONNECTION') {
      return res.status(500).json({ error: 'Cannot connect to email server. Check network.' });
    }
    
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// ========== VERIFY OTP AND LOGIN ==========
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
      // Delete expired OTP
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    
    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();
    
    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      user = new User({
        name: email.split('@')[0],
        email,
        password: Math.random().toString(36).substring(2, 15), // random password
        role: 'buyer'
      });
      await user.save();
    }
    
    // Generate JWT token
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
    console.error('Verify OTP error:', error);
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
    
    // Delete existing OTPs
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
    await sendOTPEmail(email, otp);
    
    res.json({ 
      success: true, 
      message: 'New OTP sent to your email',
      expiresIn: 600
    });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

module.exports = router;
