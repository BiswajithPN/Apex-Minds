const nodemailer = require('nodemailer');

// Cached Ethereal test transporter (lazily created once per server session)
let _devTransporter = null;
let _devUser = null;

/**
 * Returns a nodemailer transporter.
 * - Production: uses SMTP_HOST / SMTP_USER / SMTP_PASS from env.
 * - Development (no SMTP configured): auto-creates a free Ethereal.email
 *   test account. Emails are viewable at https://ethereal.email — the
 *   preview URL is printed to the backend terminal.
 */
async function getTransporter() {
  // Production SMTP configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Dev: reuse cached Ethereal account
  if (_devTransporter) return _devTransporter;

  try {
    _devUser = await nodemailer.createTestAccount();
    _devTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: _devUser.user,
        pass: _devUser.pass,
      },
    });
    console.log('\n[Email] 📬 Ethereal test account ready.');
    console.log(`[Email] 👤 User : ${_devUser.user}`);
    console.log(`[Email] 🔑 Pass : ${_devUser.pass}`);
    console.log('[Email] 🌐 View sent emails at: https://ethereal.email\n');
  } catch (err) {
    console.error('[Email] ❌ Failed to create Ethereal test account:', err.message);
    _devTransporter = null;
  }

  return _devTransporter;
}

/**
 * Internal send helper — always returns a preview URL (Ethereal) or null.
 */
async function sendMail({ from, to, subject, text, html }) {
  try {
    const transporter = await getTransporter();

    if (!transporter) {
      // Last-resort simulation if Ethereal also fails
      console.log(`\n[Email Simulation] To: ${to}`);
      console.log(`[Email Simulation] Subject: ${subject}`);
      if (text) console.log(`[Email Simulation] Body: ${text.slice(0, 200)}`);
      return null;
    }

    const sender =
      from ||
      (process.env.SMTP_USER
        ? `"HireHub" <${process.env.SMTP_USER}>`
        : `"HireHub" <${_devUser ? _devUser.user : 'noreply@hirehub.dev'}>`);

    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`\n[Email] ✅ Sent! Open to view: ${previewUrl}\n`);
    } else {
      console.log(`[Email] ✅ Sent to ${to}`);
    }

    return previewUrl || null;
  } catch (err) {
    console.error(`[Email Error] Failed to send to ${to}:`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Public helpers
// ─────────────────────────────────────────────────────────────────

const sendAccountConfirmationEmail = async (email, name) => {
  const subject = 'Welcome to HireHub — Account Created Successfully!';
  const text = `Hi ${name},\n\nWelcome to HireHub! Your account (${email}) has been created successfully.\n\nBest regards,\nThe HireHub Team`;
  const html = `
    <div style="font-family:Arial,sans-serif;padding:20px;color:#1e293b;">
      <h2 style="color:#0d9e8a;">Welcome to HireHub, ${name}! 🎉</h2>
      <p>Your account (<strong>${email}</strong>) has been created successfully.</p>
      <p>Log in to complete your profile and explore AI-powered job matching.</p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/>
      <p style="font-size:12px;color:#64748b;">If you did not create this account, ignore this email.</p>
    </div>`;
  await sendMail({ to: email, subject, text, html });
};

const sendPasswordChangeEmail = async (email) => {
  const subject = 'HireHub — Password Changed Confirmation';
  const text = `Hello,\n\nThe password for your HireHub account (${email}) was recently changed.\n\nIf you did not do this, contact support immediately.\n\nBest regards,\nThe HireHub Team`;
  const html = `
    <div style="font-family:Arial,sans-serif;padding:20px;color:#1e293b;">
      <h2 style="color:#0d9e8a;">Password Changed Successfully 🔒</h2>
      <p>The password for your account (<strong>${email}</strong>) has been updated.</p>
      <p style="color:#ef4444;font-weight:bold;">If you did not initiate this, contact support immediately.</p>
    </div>`;
  await sendMail({ to: email, subject, text, html });
};

/**
 * Sends a password reset email.
 * Returns the Ethereal preview URL (or null) so the controller can expose
 * it in the response for demo / dev testing.
 */
const sendPasswordResetEmail = async (email, resetUrl) => {
  const subject = 'HireHub — Password Reset Request';
  const text = `Hello,\n\nClick the link below to reset your HireHub password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email.\n\nBest regards,\nThe HireHub Team`;
  const html = `
    <div style="font-family:Arial,sans-serif;padding:20px;color:#1e293b;">
      <h2 style="color:#0d9e8a;">Password Reset Request 🔐</h2>
      <p>You requested a password reset for your HireHub account (<strong>${email}</strong>).</p>
      <p>Click the button below — valid for <strong>1 hour</strong>.</p>
      <div style="margin:25px 0;">
        <a href="${resetUrl}" style="background-color:#0d9e8a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
          Reset Password
        </a>
      </div>
      <p style="font-size:13px;color:#64748b;">
        Or copy and paste into your browser:<br/>
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
      <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;"/>
      <p style="font-size:12px;color:#64748b;">If you did not request this, ignore this email.</p>
    </div>`;

  const previewUrl = await sendMail({ to: email, subject, text, html });
  return previewUrl;
};

module.exports = {
  sendAccountConfirmationEmail,
  sendPasswordChangeEmail,
  sendPasswordResetEmail,
};
