import { Router } from 'express';
import { RolesController } from './roles.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';

const router = Router();

router.use(authenticate);

// Role management is not itself a "screen", so skip the Layer-3 gate.
const canManageRoles = requirePermission('roles.manage', { skipScreenCheck: true });

router.get('/', canManageRoles, RolesController.listRoles);
router.get('/permissions', canManageRoles, RolesController.listPermissions);
router.get('/:id/permissions', canManageRoles, RolesController.getRolePermissions);
router.put('/:id/permissions', canManageRoles, RolesController.setRolePermissions);
router.post('/:id/permissions', canManageRoles, RolesController.assignPermission);
router.delete('/:id/permissions/:permissionId', canManageRoles, RolesController.removePermission);

export default router;
