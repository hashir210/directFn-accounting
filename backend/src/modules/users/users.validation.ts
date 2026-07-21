import { z } from 'zod';

export const inviteUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().optional(),
    roleId: z.string().min(1, 'Role ID is required'),
  }),
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    roleId: z.string().min(1, 'Role ID is required'),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});
