import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getTaskAuditLog, getUserRecentAudit } from '../services/audit.js';

const router = Router();
router.use(requireAuth);

/** GET /api/audit/recent */
router.get('/recent', (req, res) => {
  const logs = getUserRecentAudit(req.user.id);
  res.json({ logs });
});

/** GET /api/audit/task/:taskId */
router.get('/task/:taskId', (req, res) => {
  const logs = getTaskAuditLog(Number(req.params.taskId), req.user.id);
  if (logs === null) return res.status(404).json({ error: '任务不存在或无权查看' });
  res.json({ logs });
});

export default router;
