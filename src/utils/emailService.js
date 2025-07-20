const nodemailer = require('nodemailer');

// Create transporter using SMTP configuration from environment variables
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Generate 6-digit OTP
const generateEmailOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email OTP to doctor
const sendEmailOTP = async (email, otp, doctorName = 'Doctor') => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `${process.env.FROM_NAME} <${process.env.SMTP_FROM}>`,
            to: email,
            subject: 'Email Verification - eMediHub',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .header {
              background-color: #2c5aa0;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 30px;
              background-color: #f9f9f9;
            }
            .otp-box {
              background-color: #fff;
              border: 2px dashed #2c5aa0;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
              border-radius: 8px;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #2c5aa0;
              letter-spacing: 4px;
            }
            .footer {
              background-color: #333;
              color: white;
              padding: 15px;
              text-align: center;
              font-size: 12px;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              color: #856404;
              padding: 10px;
              border-radius: 4px;
              margin: 15px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>📧 Email Verification</h1>
              <p>eMediHub - Healthcare Platform</p>
            </div>
            
            <div class="content">
              <h2>Hello ${doctorName},</h2>
              
              <p>Thank you for joining eMediHub! To complete your email verification, please use the OTP below:</p>
              
              <div class="otp-box">
                <p>Your verification code is:</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This OTP is valid for 10 minutes only</li>
                  <li>Do not share this code with anyone</li>
                  <li>Use this code only on the eMediHub platform</li>
                </ul>
              </div>
              
              <p>If you didn't request this verification, please ignore this email or contact our support team.</p>
              
              <p>Welcome to eMediHub! We're excited to have you join our healthcare community.</p>
              
              <p>Best regards,<br>
              <strong>eMediHub Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 eMediHub. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            text: `
        Hello ${doctorName},
        
        Thank you for joining eMediHub! Your email verification code is: ${otp}
        
        This OTP is valid for 10 minutes only. Please do not share this code with anyone.
        
        If you didn't request this verification, please ignore this email.
        
        Best regards,
        eMediHub Team
      `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);
        return {
            success: true,
            messageId: info.messageId,
            message: 'OTP sent successfully to your email'
        };

    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// Test email configuration
const testEmailConfiguration = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email configuration is valid');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error);
        return false;
    }
};

module.exports = {
    sendEmailOTP,
    generateEmailOTP,
    testEmailConfiguration
}; 