// backend/services/emailService.js
const nodemailer = require('nodemailer');

// ============ TRANSPORTER ============
let transporter = null;
let isInitialized = false;

const initTransporter = () => {
  if (isInitialized && transporter) return transporter;
  
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SENDER_HOST || 'smtp.sender.net',
      port: parseInt(process.env.SENDER_PORT) || 587,
      secure: process.env.SENDER_SECURE === 'true' || false,
      auth: {
        user: process.env.SENDER_USERNAME,
        pass: process.env.SENDER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000
    });

    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Sender.net SMTP error:', error.message);
        transporter = null;
        isInitialized = false;
      } else {
        console.log('✅ Sender.net SMTP is ready');
        isInitialized = true;
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create transporter:', error.message);
    transporter = null;
    isInitialized = false;
    return null;
  }
};

// ============ GENERIC SEND FUNCTION ============
const sendEmail = async (to, subject, html) => {
  // Initialize transporter if not ready
  if (!transporter || !isInitialized) {
    initTransporter();
  }

  // Mock mode if no transporter
  if (!transporter || !isInitialized) {
    console.log('🔐 MOCK MODE - Email to:', to);
    console.log('📧 Subject:', subject);
    console.log('📝 HTML:', html?.substring(0, 200) + '...');
    return { 
      success: true, 
      mock: true, 
      message: 'Mock mode - email not sent'
    };
  }

  const mailOptions = {
    from: `"MyPinkShop" <noreply@mypinkshop.com>`,
    to: to,
    subject: subject,
    html: html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to, '| MessageId:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      mock: false
    };
  } catch (error) {
    console.error('❌ Send email error:', error.message);
    // Fallback to mock mode
    console.log('🔐 FALLBACK MOCK - Email to:', to);
    return { 
      success: true, 
      mock: true, 
      error: error.message,
      message: 'Fallback mock mode'
    };
  }
};

// ============ TEST FUNCTION ============
const testEmailService = async () => {
  const result = await sendEmail(
    'test@mypinkshop.com',
    '🧪 Test Email from MyPinkShop',
    '<h1>Test Successful!</h1><p>Your email service is working.</p>'
  );
  return result;
};

module.exports = {
  sendEmail,
  testEmailService,
  initTransporter
};
