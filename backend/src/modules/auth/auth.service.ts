import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashToken 
} from '../../utils/tokens';
import { 
  BadRequestError, 
  ConflictError, 
  NotFoundError, 
  UnauthorizedError 
} from '../../utils/errors';
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail 
} from '../../utils/mailer';
import logger from '../../utils/logger';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';

export class AuthService {
  /**
   * Registers a new user and sends an email verification link
   */
  static async register(data: { email: string; password?: string; name?: string }) {
    const { email, password, name } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email is already registered');
    }

    if (!password) {
      throw new BadRequestError('Password is required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        // Public registration always creates a low-privilege account.
        // Elevated roles must be granted through an admin-only flow.
        role: 'staff',
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Create an email verification token (expires in 24 hours). The raw token
    // is emailed to the user; only its hash is persisted so a DB leak cannot be
    // used to verify/hijack accounts.
    const verificationToken = generateRefreshToken(); // Secure random bytes
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerificationToken.create({
      data: {
        token: hashToken(verificationToken),
        userId: user.id,
        expiresAt,
      },
    });

    // Send email asynchronously
    sendVerificationEmail(user.email, verificationToken).catch((err) => {
      logger.error(`[auth-service]: Async send verification email failed for ${user.email}`, err);
    });

    return user;
  }

  /**
   * Verifies the email using the provided token
   */
  static async verifyEmail(token: string) {
    const verificationTokenRecord = await prisma.emailVerificationToken.findUnique({
      where: { token: hashToken(token) },
    });

    if (!verificationTokenRecord || verificationTokenRecord.expiresAt < new Date()) {
      throw new BadRequestError('Verification token is invalid or has expired');
    }

    await prisma.user.update({
      where: { id: verificationTokenRecord.userId },
      data: { emailVerified: true },
    });

    // Clean up all verification tokens for the user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: verificationTokenRecord.userId },
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Resends the email verification link
   */
  static async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak user existence
      return { message: 'If the email exists and is unverified, a new link has been sent' };
    }
    
    if (user.emailVerified) {
      return { message: 'Email is already verified' };
    }

    const verificationToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Clean up existing tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.emailVerificationToken.create({
      data: {
        token: hashToken(verificationToken),
        userId: user.id,
        expiresAt,
      },
    });

    sendVerificationEmail(user.email, verificationToken).catch((err) => {
      logger.error(`[auth-service]: Async resend verification email failed for ${user.email}`, err);
    });

    return { message: 'If the email exists and is unverified, a new link has been sent' };
  }

  /**
   * Handles user login, checking password and whether 2FA is required
   */
  static async login(data: { email: string; password?: string }) {
    const { email, password } = data;
    if (!password) {
      throw new BadRequestError('Password is required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Issue a short-lived pre-auth token (expires in 5 minutes)
      const preAuthToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, isPreAuth: true },
        JWT_ACCESS_SECRET,
        { expiresIn: '5m' }
      );

      return {
        twoFactorRequired: true as const,
        preAuthToken,
      };
    }

    // Standard session tokens
    const tokens = await this.createSession(user.id, user.email, user.role);

    return {
      twoFactorRequired: false as const,
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Helper to create access & refresh token pair and save refresh token in DB
   */
  private static async createSession(userId: string, email: string, role: string) {
    const accessToken = generateAccessToken({ id: userId, email, role });
    const rawRefreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(rawRefreshToken);

    // Refresh token expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  /**
   * Generates a 2FA secret and returns QR Code URL for setup
   */
  static async setup2fa(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const secret = speakeasy.generateSecret({
      name: `FinFlow:${user.email}`,
    });
    const secretBase32 = secret.base32;

    // Save secret to user record, but do not set twoFactorEnabled to true yet
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secretBase32 },
    });

    const otpauthUrl = secret.otpauth_url || '';
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret: secretBase32,
      qrCode: qrCodeDataUrl,
    };
  }

  /**
   * Verifies the 2FA code and enables 2FA for the user
   */
  static async verify2fa(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestError('2FA setup is not initialized');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestError('Invalid verification code');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: 'Two-Factor Authentication enabled successfully' };
  }

  /**
   * Authenticates 2FA code during login using preAuthToken
   */
  static async authenticate2fa(preAuthToken: string, code: string) {
    let payload: any;
    try {
      payload = jwt.verify(preAuthToken, JWT_ACCESS_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired pre-authentication token');
    }

    if (!payload || !payload.isPreAuth) {
      throw new UnauthorizedError('Invalid pre-authentication token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
      throw new UnauthorizedError('Two-factor authentication is not enabled for this user');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new UnauthorizedError('Invalid verification code');
    }

    // Complete login session
    const tokens = await this.createSession(user.id, user.email, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Refreshes the session tokens (with Refresh Token Rotation)
   */
  static async refresh(refreshToken: string) {
    const hashedToken = hashToken(refreshToken);

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Reuse detection: a token that was already rotated/revoked is being
    // presented again — likely a stolen token. Revoke the whole token family
    // (all of the user's active sessions) to be safe.
    if (tokenRecord.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      logger.warn(`[auth-service]: Refresh token reuse detected for user ${tokenRecord.userId}; all sessions revoked`);
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Generate new pair
    const tokens = await this.createSession(tokenRecord.userId, tokenRecord.user.email, tokenRecord.user.role);

    // Rotate: revoke the current token (kept for reuse detection instead of deleted)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return tokens;
  }

  /**
   * Logs out the user by revoking the refresh token
   */
  static async logout(refreshToken: string) {
    const hashedToken = hashToken(refreshToken);
    // Revoke rather than delete so the token can still be recognised for reuse
    // detection. updateMany is a no-op (no throw) if the token doesn't exist.
    await prisma.refreshToken.updateMany({
      where: { token: hashedToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out successfully' };
  }

  /**
   * Initiates forgot password flow by generating and emailing a reset token
   */
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // For security, don't reveal that the user does not exist
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    const resetToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await prisma.passwordResetToken.create({
      data: {
        token: hashToken(resetToken),
        userId: user.id,
        expiresAt,
      },
    });

    // Send email asynchronously
    sendPasswordResetEmail(user.email, resetToken).catch((err) => {
      logger.error(`[auth-service]: Async send password reset failed for ${user.email}`, err);
    });

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  /**
   * Resets password using the reset token
   */
  static async resetPassword(token: string, password?: string) {
    if (!password) {
      throw new BadRequestError('Password is required');
    }

    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: hashToken(token) },
    });

    if (!resetTokenRecord || resetTokenRecord.expiresAt < new Date()) {
      throw new BadRequestError('Password reset token is invalid or has expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: resetTokenRecord.userId },
      data: { password: hashedPassword },
    });

    // Clean up reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: resetTokenRecord.userId },
    });

    return { message: 'Password reset successfully' };
  }
}
