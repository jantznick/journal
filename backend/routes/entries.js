import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { generateJournalPrompt, isAiConfigured } from '../services/ai.js';
import { personalPromptContextAllowed, promptsAllowed } from '../lib/aiMode.js';

const router = Router();

function serializeEntry(entry, { includeContent = true } = {}) {
  const base = {
    id: entry.id,
    theme: entry.theme,
    prompt: entry.prompt,
    encrypted: entry.encrypted,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };

  if (!includeContent) {
    return base;
  }

  if (entry.encrypted) {
    return {
      ...base,
      content: entry.content,
      iv: entry.iv,
      salt: entry.salt,
      locked: true,
    };
  }

  return {
    ...base,
    content: entry.content,
    iv: null,
    salt: null,
    locked: false,
  };
}

router.get('/', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const entries = await prisma.journalEntry.findMany({
    where: { userId: req.session.userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return res.json({ entries: entries.map((e) => serializeEntry(e)) });
});

router.get('/:id', async (req, res) => {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: req.params.id, userId: req.session.userId },
  });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  return res.json({ entry: serializeEntry(entry) });
});

router.post('/prompt', async (req, res) => {
  const theme = String(req.body?.theme || '').trim().slice(0, 80);
  if (!theme) {
    return res.status(400).json({ error: 'Theme is required' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { aiMode: true },
  });
  const allowAi = promptsAllowed(user?.aiMode) && isAiConfigured();
  const includePersonalContext = personalPromptContextAllowed(user?.aiMode);

  let goals = [];
  let bullets = [];
  if (includePersonalContext) {
    const latestInsight = await prisma.journalInsight.findFirst({
      where: { userId: req.session.userId },
      orderBy: { createdAt: 'desc' },
    });
    goals = Array.isArray(latestInsight?.goals) ? latestInsight.goals.map(String) : [];
    bullets = Array.isArray(latestInsight?.bullets)
      ? latestInsight.bullets.map(String).slice(0, 6)
      : [];
  }

  try {
    const result = await generateJournalPrompt({
      theme,
      goals,
      recentBullets: bullets,
      forceFallback: !allowAi,
      includePersonalContext,
    });
    return res.json({
      prompt: result.prompt,
      theme,
      ai: !result.fallback && allowAi,
      fallback: Boolean(result.fallback),
      personalContext: includePersonalContext && !result.fallback,
    });
  } catch (e) {
    console.error('[entries] prompt:', e);
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'Could not generate prompt' });
  }
});

router.post('/', async (req, res) => {
  const theme = String(req.body?.theme || '').trim().slice(0, 80);
  const prompt = String(req.body?.prompt || '').trim().slice(0, 2000);
  const content = String(req.body?.content ?? '');
  const encrypted = Boolean(req.body?.encrypted);
  const iv = req.body?.iv != null ? String(req.body.iv) : null;
  const salt = req.body?.salt != null ? String(req.body.salt) : null;

  if (!theme) return res.status(400).json({ error: 'Theme is required' });
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  if (!content.trim()) return res.status(400).json({ error: 'Entry content is required' });
  if (encrypted && (!iv || !salt)) {
    return res.status(400).json({ error: 'Encrypted entries require iv and salt' });
  }
  if (content.length > 200_000) {
    return res.status(400).json({ error: 'Entry is too large' });
  }

  const entry = await prisma.journalEntry.create({
    data: {
      userId: req.session.userId,
      theme,
      prompt,
      content,
      encrypted,
      iv: encrypted ? iv : null,
      salt: encrypted ? salt : null,
    },
  });

  return res.status(201).json({ entry: serializeEntry(entry) });
});

router.patch('/:id', async (req, res) => {
  const existing = await prisma.journalEntry.findFirst({
    where: { id: req.params.id, userId: req.session.userId },
  });
  if (!existing) return res.status(404).json({ error: 'Entry not found' });

  const data = {};
  if (req.body?.theme !== undefined) {
    data.theme = String(req.body.theme || '').trim().slice(0, 80);
  }
  if (req.body?.prompt !== undefined) {
    data.prompt = String(req.body.prompt || '').trim().slice(0, 2000);
  }
  if (req.body?.content !== undefined) {
    data.content = String(req.body.content ?? '');
    if (!data.content.trim()) return res.status(400).json({ error: 'Entry content is required' });
  }
  if (req.body?.encrypted !== undefined) {
    data.encrypted = Boolean(req.body.encrypted);
    if (data.encrypted) {
      if (!req.body?.iv || !req.body?.salt) {
        return res.status(400).json({ error: 'Encrypted entries require iv and salt' });
      }
      data.iv = String(req.body.iv);
      data.salt = String(req.body.salt);
    } else {
      data.iv = null;
      data.salt = null;
    }
  }

  const entry = await prisma.journalEntry.update({
    where: { id: existing.id },
    data,
  });

  return res.json({ entry: serializeEntry(entry) });
});

router.delete('/:id', async (req, res) => {
  const existing = await prisma.journalEntry.findFirst({
    where: { id: req.params.id, userId: req.session.userId },
  });
  if (!existing) return res.status(404).json({ error: 'Entry not found' });
  await prisma.journalEntry.delete({ where: { id: existing.id } });
  return res.status(204).send();
});

export default router;
