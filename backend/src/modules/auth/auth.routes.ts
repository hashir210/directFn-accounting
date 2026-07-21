import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import prisma from '../../config/db';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verify2faSchema,
  authenticate2faSchema,
} from './auth.validation';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 20,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV !== 'test') {
  router.use(authLimiter);
}

router.post('/register', validate(registerSchema), AuthController.register);
router.get('/verify-email', validate(verifyEmailSchema), AuthController.verifyEmail);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/resend-verification', validate(resendVerificationSchema), AuthController.resendVerification);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

// 2FA Routes
router.post('/2fa/setup', authenticate, AuthController.setup2fa);
router.post('/2fa/verify', authenticate, validate(verify2faSchema), AuthController.verify2fa);
router.post('/2fa/authenticate', validate(authenticate2faSchema), AuthController.authenticate2fa);

// Protected user profile route to verify JWT access
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [allPermissions, role, org, screenBlocks] = await Promise.all([
      prisma.permission.findMany({ select: { key: true } }),
      req.user!.roleId ? prisma.role.findUnique({
        where: { id: req.user!.roleId },
        include: { rolePermissions: { include: { permission: { select: { key: true } } } } },
      }) : null,
      prisma.organization.findUnique({
        where: { id: req.user!.organizationId },
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
        where: { userId: req.user!.id },
        select: { screenKey: true },
      }),
    ]);

    const isOwner = org?.ownerId === req.user!.id;
    const isAdmin = role?.isSystemRole && (role.name === 'Admin' || role.name === 'Owner');

    let permissionKeys: string[] = [];
    if (isOwner || isAdmin || org?.isPlatform) {
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

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...req.user,
          permissions: permissionKeys,
          isPlatformOrg: org?.isPlatform || false,
          planFeatures,
          blockedScreens,
          orgDisabledScreens,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
