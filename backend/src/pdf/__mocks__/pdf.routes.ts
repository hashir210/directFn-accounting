import { Router } from 'express';

const router = Router();

router.post('/invoice/:id/pdf', (req, res) => res.status(501).json({ success: false, message: 'PDF generation disabled in test environment' }));
router.get('/reports/:type/pdf', (req, res) => res.status(501).json({ success: false, message: 'PDF generation disabled in test environment' }));
router.post('/restart-browser', (req, res) => res.status(501).json({ success: false, message: 'PDF generation disabled in test environment' }));

export default router;