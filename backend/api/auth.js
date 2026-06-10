const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// ========== EMAIL TRANSPORTER ==========
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ========== REGISTER ==========
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    user = new User({
      name,
      email,
      password,
      role: role || 'buyer',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000
    });
    
    await user.save();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    await transporter.sendMail({
      from: `"MyPinkShop" <noreply@mypinkshop.com>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 20px;">
          <div style="text-align: center;">
            <h1 style="color: #be185d;">MyPinkShop</h1>
            <h2>Welcome to the Pink Club! 🎀</h2>
            <p>Click the link below to verify your email:</p>
            <p style="margin: 20px 0;">
              <a href="${verificationUrl}" style="color: #ec4899; word-break: break-all;">${verificationUrl}</a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours.</p>
            <p style="color: #9ca3af; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
            <hr style="border-color: #fce7f3;">
            <p style="color: #9ca3af; font-size: 12px;">Made with 💖 for the girlies</p>
          </div>
        </div>
      `
    });
    
    res.json({ success: true, message: 'Registration successful! Please check your email to verify your account.' });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ========== VERIFY EMAIL ==========
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification link' });
    }
    
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Email verified successfully! You can now login.' });
    
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ========== FORGOT PASSWORD ==========
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    await transporter.sendMail({
      from: `"MyPinkShop" <noreply@mypinkshop.com>`,
      to: email,
      subject: '🔐 Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 20px;">
          <div style="text-align: center;">
            <h1 style="color: #be185d;">MyPinkShop</h1>
            <h2>Reset Your Password 🔐</h2>
            <p>We received a request to reset your password. Click the link below to create a new password:</p>
            <p style="margin: 20px 0;">
              <a href="${resetUrl}" style="color: #ec4899; word-break: break-all;">${resetUrl}</a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour.</p>
            <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, please ignore this email.</p>
            <hr style="border-color: #fce7f3;">
            <p style="color: #9ca3af; font-size: 12px;">Made with 💖 for the girlies</p>
          </div>
        </div>
      `
    });
    
    res.json({ success: true, message: 'Password reset link sent to your email' });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

// ========== RESET PASSWORD ==========
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successful! You can now login.' });
    
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed' });
  }
});

module.exports = router;
