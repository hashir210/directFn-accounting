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

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (jwtError: any) {
      logger.warn('[auth-middleware]: JWT validation failed: %s', jwtError.message);
      throw new UnauthorizedError('Invalid or expired access token');
    }
  } catch (error) {
    next(error);
  }
}
