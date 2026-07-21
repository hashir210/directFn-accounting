import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens';
import { UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token is missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Access token is missing');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtError: any) {
      logger.warn('[auth-middleware]: JWT validation failed: %s', jwtError.message);
      throw new UnauthorizedError('Invalid or expired access token');
    }

    // Reject pre-authentication tokens (issued mid-2FA login). These are
    // signed with the same secret as access tokens but must NOT grant access
    // to protected resources until the 2FA step is completed.
    if (decoded.isPreAuth) {
      throw new UnauthorizedError('Two-factor authentication is not complete');
    }

    req.user = { id: decoded.id, email: decoded.email, organizationId: decoded.organizationId, roleId: decoded.roleId };
    next();
  } catch (error) {
    next(error);
  }
}
