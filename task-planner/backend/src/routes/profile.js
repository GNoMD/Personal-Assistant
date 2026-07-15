import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  clearUserProfile,
  getProfileDto,
  listProfileAudit,
  saveUserProfile,
} from '../services/userProfile.js';
import { profileToPlanningContext } from '../services/profilePlanningContext.js';
import {
  deleteUserAvatar,
  getAvatarMeta,
  readUserAvatar,
  saveUserAvatarFromDataUrl,
} from '../services/userAvatar.js';

const router = Router();
router.use(requireAuth);

router.get('/me', (req, res) => {
  try {
    const profile = getProfileDto(req.user.id);
    const avatar = getAvatarMeta(req.user.id);
    res.json({
      profile: {
        ...profile,
        avatar,
      },
      planningPreview: profileToPlanningContext(profile),
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '读取画像失败' });
  }
});

router.patch('/me', (req, res) => {
  try {
    const profile = saveUserProfile(req.user.id, req.body || {}, {
      id: req.user.id,
      role: req.user.role,
    });
    res.json({
      profile: {
        ...profile,
        avatar: getAvatarMeta(req.user.id),
      },
      planningPreview: profileToPlanningContext(profile),
    });
  } catch (error) {
    const status = error.status || (error.message?.includes('无效') || error.message?.includes('超出')
      ? 400
      : 500);
    res.status(status).json({ error: error.message || '保存画像失败' });
  }
});

router.delete('/me', (req, res) => {
  try {
    const profile = clearUserProfile(req.user.id, {
      id: req.user.id,
      role: req.user.role,
    });
    res.json({
      cleared: true,
      profile: {
        ...profile,
        avatar: getAvatarMeta(req.user.id),
      },
      planningPreview: profileToPlanningContext(profile),
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '清空画像失败' });
  }
});

router.get('/me/avatar', (req, res) => {
  const file = readUserAvatar(req.user.id);
  if (!file) return res.status(404).json({ error: '尚未上传头像' });
  res.set({
    'Content-Type': file.contentType,
    'Cache-Control': 'private, max-age=3600',
    'Last-Modified': file.mtime.toUTCString(),
  });
  res.send(file.buffer);
});

router.put('/me/avatar', (req, res) => {
  try {
    const meta = saveUserAvatarFromDataUrl(req.user.id, req.body?.dataUrl);
    res.json({ avatar: meta });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '上传头像失败' });
  }
});

router.delete('/me/avatar', (req, res) => {
  try {
    const removed = deleteUserAvatar(req.user.id);
    res.json({ deleted: removed, avatar: null });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '删除头像失败' });
  }
});

router.get('/me/audit', (req, res) => {
  try {
    res.json({ entries: listProfileAudit(req.user.id, 30) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || '读取审计失败' });
  }
});

export default router;
