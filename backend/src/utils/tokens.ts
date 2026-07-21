import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface UserPayload {
  id: string;
  email: string;
  organizationId: string;
  roleId: string;
  /**
   * Present (and true) only on short-lived pre-authentication tokens issued
   * mid-2FA login. Full access tokens never carry this claim.
   */
  isPreAuth?: boolean;
}

const JWT_ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET || (() => {
  throw new Error('JWT_ACCESS_SECRET environment variable is not set. Server cannot start securely.');
})();

/**
 * Generates a short-lived access token JWT (15 minutes default)
 */
export function generateAccessToken(user: UserPayload): string {
  return jwt.sign(
    { id: user.id, email: user.email, organizationId: user.organizationId, roleId: user.roleId },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

/**
 * Generates a cryptographically secure random refresh token string
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Hashes a token using SHA-256 for secure database storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verifies a JWT access token and returns the payload
 */
export function verifyAccessToken(token: string): UserPayload {
  return jwt.verify(token, JWT_ACCESS_SECRET) as UserPayload;
}
