import nodemailer from 'nodemailer';
import logger from './logger';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '2525', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@finflow.com';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  logger.info('[mailer]: SMTP credentials missing, falling back to logging emails to console');
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: Buffer }>;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, attachments } = options;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        html,
        attachments,
      });
      logger.info(`[mailer]: Email successfully sent to ${to} — subject: "${subject}"`);
      return;
    } catch (error) {
      logger.error(`[mailer]: Failed to send email to ${to}`, error);
    }
  }

  logger.info(`[mailer-fallback]: Email to ${to} — subject: "${subject}"`);
  if (attachments && attachments.length > 0) {
    logger.info(`[mailer-fallback]: Attachments: ${attachments.map(a => a.filename).join(', ')}`);
  }
}

export async function sendInvoiceEmail(options: {
  to: string;
  invoiceNo: string;
  orgName: string;
  amount: number;
  dueAt: string;
  pdfBuffer: Buffer;
}): Promise<void> {
  const { to, invoiceNo, orgName, amount, dueAt, pdfBuffer } = options;
  const subject = `Invoice ${invoiceNo} from ${orgName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2b6cb0; text-align: center;">${orgName}</h2>
      <p style="font-size: 16px;">Dear Customer,</p>
      <p>Please find your invoice <strong>${invoiceNo}</strong> attached.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; color: #718096;">Invoice Number</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold; text-align: right;">${invoiceNo}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; color: #718096;">Amount Due</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold; text-align: right; font-size: 18px;">$${amount.toFixed(2)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; color: #718096;">Due Date</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold; text-align: right;">${dueAt}</td></tr>
      </table>
      <p>You can view your invoice online at <a href="${CLIENT_URL}/dashboard/invoices">your FinFlow dashboard</a>.</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
      <p style="color: #a0aec0; font-size: 12px; text-align: center;">This is an automated email from FinFlow, please do not reply.</p>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    html,
    attachments: [{ filename: `${invoiceNo}.pdf`, content: pdfBuffer }],
  });
}

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

  await sendEmail({ to: email, subject, html });
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
