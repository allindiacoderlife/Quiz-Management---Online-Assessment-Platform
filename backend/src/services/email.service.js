import nodemailer from "nodemailer";
import { config } from "../config/app.config.js";

// Helper to determine if we should send a real email or log to console
const isSmtpConfigured = () => {
  return config.smtp.user && config.smtp.pass;
};

// Create a lazy-loaded transporter
let transporter = null;
const getTransporter = () => {
  if (!transporter && isSmtpConfigured()) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }
  return transporter;
};

/**
 * Send a generic email
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!isSmtpConfigured()) {
    console.log(`\n==========================================`);
    console.log(`📧 [EMAIL MOCK] To: ${to}`);
    console.log(`📧 [EMAIL MOCK] Subject: ${subject}`);
    console.log(`📄 [EMAIL MOCK] Content:\n${text || html.replace(/<[^>]*>/g, "")}`);
    console.log(`==========================================\n`);
    return { messageId: "mock-email-id" };
  }

  const mailOptions = {
    from: `"${config.appName || "Quiz Platform"}" <${config.smtp.from}>`,
    to,
    subject,
    text: text || html.replace(/<[^>]*>/g, ""),
    html,
  };

  try {
    const client = getTransporter();
    const info = await client.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

/**
 * Send email verification OTP
 * @param {string} to
 * @param {number|string} otp
 */
export const sendOtpEmail = async (to, otp) => {
  const subject = "Verify your email - Quiz Management Platform";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4F46E5; text-align: center;">Welcome to Quiz Management Platform!</h2>
      <p>Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
      <div style="background-color: #F3F4F6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 5px; margin: 20px 0; color: #1F2937;">
        ${otp}
      </div>
      <p style="color: #6B7280; font-size: 14px;">This OTP is valid for 10 minutes. If you did not register, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};

/**
 * Send password reset link/OTP
 * @param {string} to
 * @param {number|string} otp
 */
export const sendResetPasswordEmail = async (to, otp) => {
  const subject = "Reset your password - Quiz Management Platform";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #EF4444; text-align: center;">Password Reset Request</h2>
      <p>We received a request to reset your password. Please use the following code to complete the process:</p>
      <div style="background-color: #F3F4F6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 5px; margin: 20px 0; color: #1F2937;">
        ${otp}
      </div>
      <p style="color: #6B7280; font-size: 14px;">This code is valid for 10 minutes. If you did not request a password reset, please secure your account.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
};
