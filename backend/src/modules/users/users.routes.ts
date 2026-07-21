import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import { inviteUserSchema, updateUserRoleSchema } from './users.validation';

const router = Router();

router.use(authenticate);

// User management is not itself a "screen", so skip the Layer-3 gate.
const canManageUsers = requirePermission('users.manage', { skipScreenCheck: true });

router.get('/', canManageUsers, UsersController.listUsers);
router.post('/invite', canManageUsers, validate(inviteUserSchema), UsersController.inviteUser);
router.patch('/:id/role', canManageUsers, validate(updateUserRoleSchema), UsersController.updateUserRole);
router.delete('/:id', canManageUsers, UsersController.removeUser);
router.get('/:id/screens', canManageUsers, UsersController.getUserScreenBlocks);
router.put('/:id/screens', canManageUsers, UsersController.setUserScreenBlocks);

export default router;
