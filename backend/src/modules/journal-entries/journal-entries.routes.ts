import { Router } from 'express';
import { JournalEntriesController } from './journal-entries.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validate } from '../../middleware/validate';
import {
  createJournalEntrySchema,
  updateJournalEntrySchema,
  journalEntryIdParamSchema,
} from './journal-entries.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('accounting.view', { screenKey: 'accounting' }), JournalEntriesController.list);
router.post('/', requirePermission('accounting.create', { screenKey: 'accounting' }), validate(createJournalEntrySchema), JournalEntriesController.create);
router.get('/:id', requirePermission('accounting.view', { screenKey: 'accounting' }), validate(journalEntryIdParamSchema), JournalEntriesController.getById);
router.patch('/:id', requirePermission('accounting.update', { screenKey: 'accounting' }), validate(journalEntryIdParamSchema), validate(updateJournalEntrySchema), JournalEntriesController.update);
router.post('/:id/post', requirePermission('accounting.approve', { screenKey: 'accounting' }), validate(journalEntryIdParamSchema), JournalEntriesController.post);
router.delete('/:id', requirePermission('accounting.delete', { screenKey: 'accounting' }), validate(journalEntryIdParamSchema), JournalEntriesController.delete);

export default router;
