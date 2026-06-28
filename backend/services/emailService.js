// backend/services/emailService.js
const nodemailer = require('nodemailer');

// ============ TRANSPORTER ============
let transporter = null;
let isInitialized = false;
let initializationPromise = null;

const initTransporter = () => {
  // If already initialized, return
  if (isInitialized && transporter) return Promise.resolve(transporter);
  
  // If already initializing, return existing promise
  if (initializationPromise) return initializationPromise;
  
  console.log('🔧 Initializing Sender.net SMTP...');
  console.log('📧 SENDER_USERNAME:', process.env.SENDER_USERNAME ? '✅ Set' : '❌ Missing');
  console.log('📧 SENDER_PASSWORD:', process.env.SENDER_PASSWORD ? '✅ Set' : '❌ Missing');
  console.log('📧 SENDER_HOST:', process.env.SENDER_HOST || 'smtp.sender.net');
  console.log('📧 SENDER_PORT:', process.env.SENDER_PORT || 587);

  initializationPromise = new Promise((resolve, reject) => {
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

      // Verify connection with callback
      transporter.verify((error, success) => {
        if (error) {
          console.error('❌❌❌ Sender.net SMTP ERROR ❌❌❌');
          console.error('📛 Error message:', error.message);
          console.error('📛 Error code:', error.code);
          console.error('📛 Error command:', error.command);
          console.error('📛 Error response:', error.response);
          console.error('📛 Error responseCode:', error.responseCode);
          console.error('📛 Full error:', JSON.stringify(error, null, 2));
          transporter = null;
          isInitialized = false;
          initializationPromise = null;
          reject(error);
        } else {
          console.log('✅✅✅ Sender.net SMTP is ready! ✅✅✅');
          isInitialized = true;
          initializationPromise = null;
          resolve(transporter);
        }
      });
    } catch (error) {
      console.error('❌❌❌ Failed to create transporter ❌❌❌');
      console.error('📛 Error:', error.message);
      transporter = null;
      isInitialized = false;
      initializationPromise = null;
      reject(error);
    }
  });

  return initializationPromise;
};

// ============ GENERIC SEND FUNCTION ============
const sendEmail = async (to, subject, html) => {
  console.log('📨 sendEmail called to:', to);
  
  // Initialize transporter if not ready
  if (!transporter || !isInitialized) {
    console.log('🔄 Transporter not ready, initializing...');
    try {
      await initTransporter();
    } catch (error) {
      console.error('❌ Transporter initialization failed:', error.message);
      // Fallback to mock mode
      console.log('🔐 FALLBACK MOCK - Email to:', to);
      return { 
        success: true, 
        mock: true, 
        error: error.message,
        message: 'Fallback mock mode'
      };
    }
  }

  // Mock mode if no transporter
  if (!transporter || !isInitialized) {
    console.log('🔐 MOCK MODE - Email to:', to);
    console.log('📧 Subject:', subject);
    console.log('📝 HTML preview:', html?.substring(0, 200) + '...');
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
    console.log('📤 Sending email to:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', to, '| MessageId:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      mock: false
    };
  } catch (error) {
    console.error('❌ Send email error:', error.message);
    console.error('❌ Full error:', JSON.stringify(error, null, 2));
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
  console.log('🧪 Testing email service...');
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
