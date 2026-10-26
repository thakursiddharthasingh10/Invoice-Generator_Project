import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';

const router = Router();
router.use(requireAuth);

// GET /api/profile/business
router.get('/business', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const row = db.prepare('SELECT business_profile FROM users WHERE id = ?').get(userId) as any;
    
    if (!row || !row.business_profile) {
      return res.status(200).json(null);
    }

    try {
      return res.status(200).json(JSON.parse(row.business_profile));
    } catch (e) {
      return res.status(200).json(null);
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve business profile.' });
  }
});

// PUT /api/profile/business
router.put('/business', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const businessData = req.body;

    const jsonStr = JSON.stringify(businessData || {});
    db.prepare('UPDATE users SET business_profile = ?, updated_at = ? WHERE id = ?')
      .run(jsonStr, new Date().toISOString(), userId);

    return res.status(200).json({ success: true, profile: businessData });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update business profile.' });
  }
});

export default router;
