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
  NotFoundError, 
  UnauthorizedError,
  ForbiddenError,
} from '../../utils/errors';
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail 
} from '../../utils/mailer';
import logger from '../../utils/logger';

import { OrganizationService } from '../organization/organization.service';

const JWT_ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET || (() => {
  throw new Error('JWT_ACCESS_SECRET environment variable is not set');
})();

export class AuthService {
  /**
   * Registers a new user and their new Organization. Sends email verification.
   */
  static async register(data: { email: string; password?: string; name?: string; organizationName: string }) {
    const { email, password, name, organizationName } = data;

    if (!organizationName) {
      throw new BadRequestError('Organization name is required');
    }

    if (!password) {
      throw new BadRequestError('Password is required');
    }

    // NOTE: registration always provisions a brand-new organization, and email
    // uniqueness is scoped per-organization (@@unique([organizationId, email])),
    // so there is no global-duplicate check here — the same person may own more
    // than one workspace.

    const hashedPassword = await bcrypt.hash(password, 10);

    const { user, org } = await OrganizationService.createOrganizationWithUser(organizationName, {
      email,
      passwordHash: hashedPassword,
      name,
    });

    // Create an email verification token (expires in 7 days). The raw token
    // is emailed to the user; only its hash is persisted so a DB leak cannot be
    // used to verify/hijack accounts.
    const verificationToken = generateRefreshToken(); // Secure random bytes
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      roleId: user.roleId,
      emailVerified: user.emailVerified,
    };
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

    const user = await prisma.user.findUnique({ where: { id: verificationTokenRecord.userId } });
    if (user?.emailVerified) {
      await prisma.emailVerificationToken.delete({ where: { id: verificationTokenRecord.id } });
      throw new BadRequestError('Email is already verified');
    }

    await prisma.user.update({
      where: { id: verificationTokenRecord.userId },
      data: { emailVerified: true },
    });

    // Clean up the used token
    await prisma.emailVerificationToken.delete({ where: { id: verificationTokenRecord.id } });

    return { message: 'Email verified successfully' };
  }

  /**
   * Resends the email verification link
   */
  static async resendVerification(email: string, organizationId?: string) {
    const user = organizationId
      ? await prisma.user.findUnique({ where: { organizationId_email: { organizationId, email } } })
      : await prisma.user.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } });
    if (!user) {
      // Don't leak user existence
      return { message: 'If the email exists and is unverified, a new link has been sent' };
    }
    
    if (user.emailVerified) {
      return { message: 'Email is already verified' };
    }

    const verificationToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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
  static async login(data: { email: string; password?: string; organizationId?: string }) {
    const { email, password, organizationId } = data;
    if (!password) {
      throw new BadRequestError('Password is required');
    }

    let user;
    if (organizationId) {
      user = await prisma.user.findUnique({
        where: { organizationId_email: { organizationId, email } },
      });
    } else {
      user = await prisma.user.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
      });
    }

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
        { id: user.id, email: user.email, roleId: user.roleId, organizationId: user.organizationId, isPreAuth: true },
        JWT_ACCESS_SECRET,
        { expiresIn: '5m' }
      );

      return {
        twoFactorRequired: true as const,
        preAuthToken,
      };
    }

    // Standard session tokens
    const tokens = await this.createSession(user.id, user.email, user.roleId || '', user.organizationId);

    const [allPermissions, role, org, screenBlocks] = await Promise.all([
      prisma.permission.findMany({ select: { key: true } }),
      user.roleId ? prisma.role.findUnique({
        where: { id: user.roleId },
        include: { rolePermissions: { include: { permission: { select: { key: true } } } } },
      }) : null,
      prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { 
          ownerId: true,
          isPlatform: true,
          disabledScreens: true,
          plan: {
            select: {
              features: { select: { featureKey: true } }
            }
          }
        },
      }),
      prisma.userScreenBlock.findMany({
        where: { userId: user.id },
        select: { screenKey: true },
      }),
    ]);

    const isOwner = org?.ownerId === user.id;
    const isAdmin = role?.isSystemRole && (role.name === 'Admin' || role.name === 'Owner');

    let permissionKeys: string[] = [];
    if (isOwner || isAdmin) {
      permissionKeys = allPermissions.map(p => p.key);
    } else if (role) {
      permissionKeys = role.rolePermissions.map(rp => rp.permission.key);
    }

    let orgDisabledScreens: string[] = [];
    if (org?.disabledScreens) {
      try { orgDisabledScreens = JSON.parse(org.disabledScreens); } catch (e) { orgDisabledScreens = []; }
    }

    const planFeatures = org?.plan?.features.map(pf => pf.featureKey) || [];
    const blockedScreens = screenBlocks.map(b => b.screenKey);

    return {
      twoFactorRequired: false as const,
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        roleName: role?.name || '',
        organizationId: user.organizationId,
        permissions: permissionKeys,
        isPlatformOrg: org?.isPlatform || false,
        planFeatures,
        blockedScreens,
        orgDisabledScreens,
      },
    };
  }

  /**
   * Helper to create access & refresh token pair and save refresh token in DB
   */
  private static async createSession(userId: string, email: string, roleId: string, organizationId: string) {
    const accessToken = generateAccessToken({ id: userId, email, roleId, organizationId });
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
    const tokens = await this.createSession(user.id, user.email, user.roleId || '', user.organizationId);

    const [allPermissions, role, org, screenBlocks] = await Promise.all([
      prisma.permission.findMany({ select: { key: true } }),
      user.roleId ? prisma.role.findUnique({
        where: { id: user.roleId },
        include: { rolePermissions: { include: { permission: { select: { key: true } } } } },
      }) : null,
      prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { 
          ownerId: true,
          isPlatform: true,
          disabledScreens: true,
          plan: {
            select: {
              features: { select: { featureKey: true } }
            }
          }
        },
      }),
      prisma.userScreenBlock.findMany({
        where: { userId: user.id },
        select: { screenKey: true },
      }),
    ]);

    const isOwner = org?.ownerId === user.id;
    const isAdmin = role?.isSystemRole && (role.name === 'Admin' || role.name === 'Owner');

    let permissionKeys: string[] = [];
    if (isOwner || isAdmin) {
      permissionKeys = allPermissions.map(p => p.key);
    } else if (role) {
      permissionKeys = role.rolePermissions.map(rp => rp.permission.key);
    }

    let orgDisabledScreens: string[] = [];
    if (org?.disabledScreens) {
      try { orgDisabledScreens = JSON.parse(org.disabledScreens); } catch (e) { orgDisabledScreens = []; }
    }

    const planFeatures = org?.plan?.features.map(pf => pf.featureKey) || [];
    const blockedScreens = screenBlocks.map(b => b.screenKey);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        roleName: role?.name || '',
        organizationId: user.organizationId,
        permissions: permissionKeys,
        isPlatformOrg: org?.isPlatform || false,
        planFeatures,
        blockedScreens,
        orgDisabledScreens,
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
    const tokens = await this.createSession(tokenRecord.userId, tokenRecord.user.email, tokenRecord.user.roleId || '', tokenRecord.user.organizationId);

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

  static async listSessions(userId: string, currentRefreshToken?: string) {
    const currentTokenHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
    const sessions = await prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: currentTokenHash ? session.token === currentTokenHash : false,
    }));
  }

  static async revokeSession(userId: string, sessionId: string) {
    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
      select: { userId: true, revokedAt: true, expiresAt: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new NotFoundError('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenError('You cannot revoke another user session');
    }

    await prisma.refreshToken.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Session revoked successfully' };
  }

  static async revokeOtherSessions(userId: string, currentRefreshToken?: string) {
    if (!currentRefreshToken) {
      throw new BadRequestError('Current refresh token is required');
    }

    const currentTokenHash = hashToken(currentRefreshToken);
    const result = await prisma.refreshToken.updateMany({
      where: {
        userId,
        token: { not: currentTokenHash },
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });

    return {
      message: 'Other sessions revoked successfully',
      revokedCount: result.count,
    };
  }

  /**
   * Initiates forgot password flow by generating and emailing a reset token
   */
  static async forgotPassword(email: string, organizationId?: string) {
    const user = organizationId
      ? await prisma.user.findUnique({ where: { organizationId_email: { organizationId, email } } })
      : await prisma.user.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } });
    if (!user) {
      // For security, don't reveal that the user does not exist
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    const resetToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour expiry

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
