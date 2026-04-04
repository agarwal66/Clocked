const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email.html?token=${token}`;
    
    const mailOptions = {
      from: `"Clocked" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Verify your Clocked account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your Clocked account</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0C0C0A; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #0C0C0A; margin-bottom: 10px; }
            .button { display: inline-block; background: #0C0C0A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E4DE; font-size: 14px; color: #5E5D58; }
            .code { background: #F2F1EC; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚩 Clocked</div>
              <h1>Verify your email address</h1>
            </div>
            
            <p>Hi ${user.username},</p>
            
            <p>Thanks for signing up for Clocked! To complete your registration and start using the platform, please verify your email address.</p>
            
            <p>Click the button below to verify your account:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p class="code">${verificationUrl}</p>
            
            <p><strong>This link expires in 24 hours.</strong></p>
            
            <p>If you didn't create an account with Clocked, you can safely ignore this email.</p>
            
            <div class="footer">
              <p>Best regards,<br>The Clocked Team</p>
              <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
    
    const mailOptions = {
      from: `"Clocked" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Reset your Clocked password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your Clocked password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0C0C0A; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #0C0C0A; margin-bottom: 10px; }
            .button { display: inline-block; background: #0C0C0A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E4DE; font-size: 14px; color: #5E5D58; }
            .warning { background: #FFF0F0; border: 1px solid #FFBDBE; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .code { background: #F2F1EC; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚩 Clocked</div>
              <h1>Reset your password</h1>
            </div>
            
            <p>Hi ${user.username},</p>
            
            <p>We received a request to reset the password for your Clocked account. If you made this request, click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p class="code">${resetUrl}</p>
            
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong></p>
              <ul>
                <li>This link expires in 30 minutes</li>
                <li>If you didn't request a password reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The Clocked Team</p>
              <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(user) {
    const mailOptions = {
      from: `"Clocked" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Welcome to Clocked! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Clocked</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0C0C0A; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #0C0C0A; margin-bottom: 10px; }
            .button { display: inline-block; background: #0C0C0A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E4DE; font-size: 14px; color: #5E5D58; }
            .feature { background: #F0FFF8; border: 1px solid #A3E6C8; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚩 Clocked</div>
              <h1>Welcome to Clocked! 🎉</h1>
            </div>
            
            <p>Hi ${user.username},</p>
            
            <p>Welcome to the community! Your account is now verified and you're ready to start using Clocked.</p>
            
            <div class="feature">
              <h3>🔍 What you can do now:</h3>
              <ul>
                <li>Search for Instagram handles to see community insights</li>
                <li>Post anonymous or named flags about your experiences</li>
                <li>Build your credibility score with honest contributions</li>
                <li>Watch handles to get notified of new flags</li>
              </ul>
            </div>
            
            <p>Ready to get started?</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}" class="button">Go to Clocked</a>
            </div>
            
            <p>Remember to be respectful and honest in your contributions. Together we're building a more transparent community.</p>
            
            <div class="footer">
              <p>Best regards,<br>The Clocked Team</p>
              <p style="font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
