import OpenAI from 'openai';
import { themeLabel } from '../lib/themes.js';

let client = null;

export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw Object.assign(new Error('OPENAI_API_KEY is not set'), { status: 503 });
  }
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}),
    });
  }
  return client;
}

export function getModel() {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

const FALLBACK_PROMPTS = {
  reflection:
    'What moment from today keeps coming back to you — and what do you think it is trying to tell you?',
  gratitude:
    'Name three small things that made today a little better. Why did each one matter?',
  anxiety:
    'What is weighing on you right now? Write it out, then note one thing that is still within your control.',
  goals:
    'What are you working toward lately? Where did you make progress, stall, or learn something useful?',
  relationships:
    'How did you show up in your relationships today? Is there a conversation you want to have — or one you are glad you had?',
  freewrite: 'What do you need to get off your mind tonight? Start anywhere and keep going.',
};

function fallbackPrompt(theme) {
  const key = String(theme || '').toLowerCase();
  return (
    FALLBACK_PROMPTS[key] ||
    `A user in a journaling app needs a thoughtful prompt. They are focused on "${themeLabel(theme)}". Ask one open, warm question that invites honest writing.`
  );
}

/**
 * Generate a single journaling prompt for this session.
 */
export async function generateJournalPrompt({
  theme,
  goals = [],
  recentBullets = [],
  forceFallback = false,
  /** When false, only the focus label is sent — no goals or past highlights. */
  includePersonalContext = true,
}) {
  const label = themeLabel(theme);

  if (forceFallback || !isAiConfigured()) {
    return { prompt: fallbackPrompt(theme), model: null, fallback: true };
  }

  const openai = getClient();
  const model = getModel();

  let userContent;
  if (includePersonalContext) {
    const goalsBlock =
      goals.length > 0
        ? `Their current focus / goals:\n${goals.map((g) => `- ${g}`).join('\n')}`
        : 'No stored goals yet.';
    const bulletsBlock =
      recentBullets.length > 0
        ? `Recent insight highlights:\n${recentBullets.map((b) => `- ${b}`).join('\n')}`
        : 'No prior insights yet.';
    userContent =
      `A user needs a prompt to help them write. They are focused on: ${label}.\n\n` +
      `${goalsBlock}\n\n${bulletsBlock}\n\n` +
      'Write one inviting prompt that fits their focus and gently nods at goals/insights when useful.';
  } else {
    userContent =
      `A user in a journaling app needs a prompt to help them write. ` +
      `They are focused on: ${label}.\n\n` +
      'Write one inviting, generic prompt for that focus. Do not assume personal history, ' +
      'names, relationships, or past entries — keep it broadly useful for anyone.';
  }

  const res = await openai.chat.completions.create({
    model,
    temperature: 0.85,
    max_tokens: 220,
    messages: [
      {
        role: 'system',
        content:
          'You write short journaling prompts for a private journaling app. ' +
          'Return ONLY the prompt text — one or two sentences, warm, specific, non-clinical. ' +
          'No quotes, no preamble, no markdown.',
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
  });

  const prompt = res.choices?.[0]?.message?.content?.trim();
  if (!prompt) {
    return { prompt: fallbackPrompt(theme), model, fallback: true };
  }
  return { prompt, model, fallback: false };
}

/**
 * Summarize recent plaintext journal entries into bullets + running goals.
 */
export async function generateInsights({ entries, priorGoals = [] }) {
  if (!isAiConfigured()) {
    throw Object.assign(new Error('Summaries aren’t available right now.'), { status: 503 });
  }

  const openai = getClient();
  const model = getModel();

  const corpus = entries
    .map((e, i) => {
      const plain = stripHtml(e.content).slice(0, 2500);
      return `Entry ${i + 1} (${e.createdAt.toISOString().slice(0, 10)}, theme: ${e.theme}):\nPrompt: ${e.prompt}\n${plain}`;
    })
    .join('\n\n---\n\n');

  const res = await openai.chat.completions.create({
    model,
    temperature: 0.5,
    response_format: { type: 'json_object' },
    max_tokens: 800,
    messages: [
      {
        role: 'system',
        content:
          'You analyze private journal entries and return JSON only. ' +
          'Schema: {"bullets": string[], "goals": string[]}. ' +
          'bullets: 2-6 short observations about themes, feelings, or patterns (even from a single entry). ' +
          'goals: 1-5 concise running focus areas the writer seems to be working on. ' +
          'Be respectful, concrete, and avoid clinical diagnosis.',
      },
      {
        role: 'user',
        content:
          `Prior goals (may update):\n${priorGoals.length ? priorGoals.map((g) => `- ${g}`).join('\n') : '(none)'}\n\n` +
          `Recent entries:\n${corpus}`,
      },
    ],
  });

  const raw = res.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error('Empty insights response from OpenAI');

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON from OpenAI for insights');
  }

  const bullets = Array.isArray(data.bullets)
    ? data.bullets.map((b) => String(b).trim()).filter(Boolean).slice(0, 8)
    : [];
  const goals = Array.isArray(data.goals)
    ? data.goals.map((g) => String(g).trim()).filter(Boolean).slice(0, 8)
    : [];

  return { bullets, goals, model };
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
