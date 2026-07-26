import { Request, Response } from 'express';
import { auditService } from './audit.service';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    const data = await auditService.getLogs(organizationId, limit, offset);

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
