import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verify2faSchema,
  authenticate2faSchema,
} from './auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), AuthController.register);
router.get('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/resend-verification', validate(forgotPasswordSchema), AuthController.resendVerification);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

// 2FA Routes
router.post('/2fa/setup', authenticate, AuthController.setup2fa);
router.post('/2fa/verify', authenticate, validate(verify2faSchema), AuthController.verify2fa);
router.post('/2fa/authenticate', validate(authenticate2faSchema), AuthController.authenticate2fa);

// Protected user profile route to verify JWT access
router.get('/me', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

export default router;
