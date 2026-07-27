import { Router } from 'express';
import { ArchiveController } from './archive.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// Get all archives
router.get('/', authenticate, ArchiveController.getArchives);

// Create manual archive
router.post(
  '/',
  authenticate,
  ArchiveController.createArchive
);

export default router;
