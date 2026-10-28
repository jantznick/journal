import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { STARTER_THEME_GROUPS, STARTER_THEMES } from '../lib/themes.js';
import { AI_MODES, normalizeAiMode } from '../lib/aiMode.js';

const router = Router();

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  defaultTheme: true,
  aiMode: true,
};

router.get('/themes', (_req, res) => {
  res.json({ themes: STARTER_THEMES, groups: STARTER_THEME_GROUPS });
});

router.get('/profile', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: userSelect,
  });
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ user: { ...user, aiMode: normalizeAiMode(user.aiMode) } });
});

router.patch('/profile', async (req, res) => {
  const displayName =
    req.body?.displayName !== undefined ? String(req.body.displayName || '').trim().slice(0, 80) : undefined;
  const defaultTheme =
    req.body?.defaultTheme !== undefined
      ? String(req.body.defaultTheme || '').trim().slice(0, 80) || 'reflection'
      : undefined;
  const aiMode =
    req.body?.aiMode !== undefined ? normalizeAiMode(req.body.aiMode) : undefined;

  if (req.body?.aiMode !== undefined && !AI_MODES.includes(String(req.body.aiMode).trim().toLowerCase())) {
    return res.status(400).json({ error: 'Invalid AI preference' });
  }

  const data = {};
  if (displayName !== undefined) data.displayName = displayName || null;
  if (defaultTheme !== undefined) data.defaultTheme = defaultTheme;
  if (aiMode !== undefined) data.aiMode = aiMode;

  const user = await prisma.user.update({
    where: { id: req.session.userId },
    data,
    select: userSelect,
  });

  return res.json({ user: { ...user, aiMode: normalizeAiMode(user.aiMode) } });
});

export default router;
