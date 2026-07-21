import nodemailer from 'nodemailer';
import logger from './logger';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '2525', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@finflow.com';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

let transporter: nodemailer.Transporter | null = null;

// Initialize transporter only if credentials are provided
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  logger.info('[mailer]: SMTP credentials missing, falling back to logging emails to console');
}

/**
 * Sends a registration email verification link
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${CLIENT_URL}/verify-email?token=${token}`;
  const subject = 'Verify Your Email - FinFlow';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2b6cb0; text-align: center;">Welcome to FinFlow</h2>
      <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
      </div>
      <p>This verification link will expire in 7 days.</p>
      <p style="word-break: break-all; color: #718096; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:<br>${verificationUrl}</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="color: #a0aec0; font-size: 12px; text-align: center;">This is an automated email, please do not reply.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject,
        html,
      });
      logger.info(`[mailer]: Verification email successfully sent to ${email}`);
    } catch (error) {
      logger.error(`[mailer]: Failed to send verification email to ${email}`, error);
      // Fallback log
      logger.info(`[mailer-fallback]: Click here to verify email for ${email}: ${verificationUrl}`);
    }
  } else {
    logger.info(`[mailer-fallback]: Click here to verify email for ${email}: ${verificationUrl}`);
  }
}

/**
 * Sends a password reset link
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
  const subject = 'Reset Your Password - FinFlow';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #c53030; text-align: center;">Reset Your Password</h2>
      <p>You requested a password reset. Please click the link below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>This reset link will expire in 24 hours. If you did not make this request, you can safely ignore this email.</p>
      <p style="word-break: break-all; color: #718096; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser:<br>${resetUrl}</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="color: #a0aec0; font-size: 12px; text-align: center;">This is an automated email, please do not reply.</p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to: email,
        subject,
        html,
      });
      logger.info(`[mailer]: Password reset email successfully sent to ${email}`);
    } catch (error) {
      logger.error(`[mailer]: Failed to send password reset email to ${email}`, error);
      // Fallback log
      logger.info(`[mailer-fallback]: Click here to reset password for ${email}: ${resetUrl}`);
    }
  } else {
    logger.info(`[mailer-fallback]: Click here to reset password for ${email}: ${resetUrl}`);
  }
}
