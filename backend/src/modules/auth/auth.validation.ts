import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().optional(),
    // NOTE: `role` is intentionally NOT accepted here. Public self-registration
    // must never let a user choose their own role (privilege escalation).
    // Role assignment is performed server-side / via an admin-only flow.
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
});

export const verify2faSchema = z.object({
  body: z.object({
    token: z.string().length(6, 'TOTP code must be exactly 6 digits'),
  }),
});

export const authenticate2faSchema = z.object({
  body: z.object({
    preAuthToken: z.string().min(1, 'Pre-authentication token is required'),
    token: z.string().length(6, 'TOTP code must be exactly 6 digits'),
  }),
});
