import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { generateInsights, isAiConfigured } from '../services/ai.js';
import { insightsAllowed, normalizeAiMode } from '../lib/aiMode.js';

const router = Router();

function serializeInsight(insight) {
  return {
    id: insight.id,
    bullets: insight.bullets,
    goals: insight.goals,
    sourceCount: insight.sourceCount,
    createdAt: insight.createdAt,
  };
}

router.get('/', async (req, res) => {
  const [latest, user] = await Promise.all([
    prisma.journalInsight.findFirst({
      where: { userId: req.session.userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { aiMode: true },
    }),
  ]);

  const aiMode = normalizeAiMode(user?.aiMode);
  return res.json({
    insight: latest ? serializeInsight(latest) : null,
    aiConfigured: isAiConfigured(),
    aiMode,
    insightsEnabled: insightsAllowed(aiMode) && isAiConfigured(),
  });
});

/**
 * Generate insights.
 * Prefer client-provided plaintext `entries` (so private entries can be included
 * after the user decrypts + confirms in the UI). Otherwise use stored public entries.
 */
router.post('/generate', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { aiMode: true },
  });
  if (!insightsAllowed(user?.aiMode)) {
    return res.status(403).json({
      error: 'AI summaries are turned off in your settings.',
    });
  }
  if (!isAiConfigured()) {
    return res.status(503).json({
      error: 'Summaries aren’t available right now. Try again later.',
    });
  }

  const limit = Math.min(Number(req.body?.limit) || 15, 30);
  let corpus = [];

  if (Array.isArray(req.body?.entries) && req.body.entries.length > 0) {
    corpus = req.body.entries
      .slice(0, limit)
      .map((e) => ({
        theme: String(e?.theme || 'reflection').slice(0, 80),
        prompt: String(e?.prompt || '').slice(0, 2000),
        content: String(e?.content || '').slice(0, 20000),
        createdAt: e?.createdAt ? new Date(e.createdAt) : new Date(),
      }))
      .filter((e) => e.content.trim());
  } else {
    const rows = await prisma.journalEntry.findMany({
      where: { userId: req.session.userId, encrypted: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    corpus = rows.reverse();
  }

  if (corpus.length === 0) {
    return res.status(400).json({
      error: 'No entries to summarize yet.',
    });
  }

  const prior = await prisma.journalInsight.findFirst({
    where: { userId: req.session.userId },
    orderBy: { createdAt: 'desc' },
  });
  const priorGoals = Array.isArray(prior?.goals) ? prior.goals.map(String) : [];

  try {
    const { bullets, goals } = await generateInsights({
      entries: corpus,
      priorGoals,
    });

    const insight = await prisma.journalInsight.create({
      data: {
        userId: req.session.userId,
        bullets,
        goals,
        sourceCount: corpus.length,
      },
    });

    return res.status(201).json({ insight: serializeInsight(insight) });
  } catch (e) {
    console.error('[insights] generate:', e);
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'Could not generate insights' });
  }
});

router.patch('/goals', async (req, res) => {
  const goals = Array.isArray(req.body?.goals)
    ? req.body.goals.map((g) => String(g).trim()).filter(Boolean).slice(0, 12)
    : null;
  if (!goals) {
    return res.status(400).json({ error: 'goals must be an array of strings' });
  }

  const prior = await prisma.journalInsight.findFirst({
    where: { userId: req.session.userId },
    orderBy: { createdAt: 'desc' },
  });

  const insight = prior
    ? await prisma.journalInsight.update({
        where: { id: prior.id },
        data: { goals },
      })
    : await prisma.journalInsight.create({
        data: {
          userId: req.session.userId,
          bullets: [],
          goals,
          sourceCount: 0,
        },
      });

  return res.json({ insight: serializeInsight(insight) });
});

export default router;
