/**
 * Client-side copy of starter themes for dropdowns (labels only — no tech ids in UI).
 * Keep ids/labels in sync with backend/lib/themes.js.
 */
export const STARTER_THEME_GROUPS = [
  {
    id: 'inward',
    label: 'Looking inward',
    themes: [
      { id: 'reflection', label: 'Reflection' },
      { id: 'mental-health', label: 'Mental health' },
      { id: 'anxiety', label: 'Anxiety' },
      { id: 'calm', label: 'Calm & grounding' },
      { id: 'stress', label: 'Stress' },
      { id: 'self-compassion', label: 'Self-compassion' },
    ],
  },
  {
    id: 'body',
    label: 'Body & energy',
    themes: [
      { id: 'physical', label: 'Physical health' },
      { id: 'sleep', label: 'Sleep & rest' },
      { id: 'energy', label: 'Energy & movement' },
    ],
  },
  {
    id: 'growth',
    label: 'Growth & meaning',
    themes: [
      { id: 'gratitude', label: 'Gratitude' },
      { id: 'goals', label: 'Goals & progress' },
      { id: 'mindfulness', label: 'Mindfulness' },
      { id: 'creativity', label: 'Creativity' },
    ],
  },
  {
    id: 'life',
    label: 'People & work',
    themes: [
      { id: 'relationships', label: 'Relationships' },
      { id: 'work', label: 'Work & career' },
    ],
  },
  {
    id: 'character',
    label: 'Character & habits',
    themes: [
      { id: 'self-awareness', label: 'Self-awareness' },
      { id: 'consideration', label: 'Consideration' },
      { id: 'competitiveness', label: 'Ease competitiveness' },
      { id: 'slowing-down', label: 'Slowing down' },
      { id: 'patience', label: 'Patience' },
      { id: 'confidence', label: 'Confidence' },
      { id: 'boundaries', label: 'Boundaries' },
      { id: 'authenticity', label: 'Authenticity' },
      { id: 'empathy', label: 'Empathy' },
      { id: 'consistency', label: 'Consistency' },
    ],
  },
  {
    id: 'open',
    label: 'Open',
    themes: [{ id: 'freewrite', label: 'Free write' }],
  },
];

export const STARTER_THEMES = STARTER_THEME_GROUPS.flatMap((g) => g.themes);

export function isStarterTheme(value) {
  return STARTER_THEMES.some((t) => t.id === value);
}

export function themeLabel(value) {
  const found = STARTER_THEMES.find((t) => t.id === value);
  return found?.label || String(value || '').trim() || 'Free write';
}
