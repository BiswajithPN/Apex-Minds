const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const sendAccountConfirmationEmail = async (email, name) => {
  const subject = 'Welcome to HireHub — Account Created Successfully!';
  const text = `Hi ${name},\n\nWelcome to HireHub! Your account (${email}) has been created successfully.\n\nYou can now log in and explore AI-powered job matching.\n\nBest regards,\nThe HireHub Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #0d9e8a;">Welcome to HireHub, ${name}! 🎉</h2>
      <p>Your account (<strong>${email}</strong>) has been created successfully.</p>
      <p>You can now log in to complete your profile and explore AI-powered job matching.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">If you did not create this account, please ignore this email.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"HireHub" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        text,
        html,
      });
      console.log(`[Email Sent] Account confirmation email sent to: ${email}`);
    } catch (err) {
      console.error(`[Email Error] Failed to send email to ${email}:`, err.message);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL CONFIRMATION SIMULATION]`);
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log(`======================================================\n`);
  }
};

const sendPasswordChangeEmail = async (email) => {
  const subject = 'HireHub — Password Changed Confirmation';
  const text = `Hello,\n\nThis is confirmation that the password for your HireHub account (${email}) was recently changed.\n\nIf you did not perform this change, please contact support immediately.\n\nBest regards,\nThe HireHub Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #0d9e8a;">Password Changed Successfully 🔒</h2>
      <p>The password for your HireHub account (<strong>${email}</strong>) has been updated.</p>
      <p style="color: #ef4444; font-weight: bold;">If you did not initiate this change, please contact HireHub support immediately.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b;">© HireHub AI Job Marketplace</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"HireHub Security" <${process.env.SMTP_USER}>`,
        to: email,
        subject,
        text,
        html,
      });
      console.log(`[Email Sent] Password change confirmation sent to: ${email}`);
    } catch (err) {
      console.error(`[Email Error] Failed to send email to ${email}:`, err.message);
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL PASSWORD CHANGE SIMULATION]`);
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log(`======================================================\n`);
  }
};

module.exports = {
  sendAccountConfirmationEmail,
  sendPasswordChangeEmail,
};
