export const STARTER_THEMES = [
  {
    id: 'reflection',
    label: 'Reflection',
    description: 'Look back on the day with honesty and curiosity.',
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    description: 'Notice what went well and who helped along the way.',
  },
  {
    id: 'anxiety',
    label: 'Anxiety & calm',
    description: 'Name worries, then find what is within your control.',
  },
  {
    id: 'goals',
    label: 'Goals & progress',
    description: 'Check in on direction, momentum, and next steps.',
  },
  {
    id: 'relationships',
    label: 'Relationships',
    description: 'Explore connection, conflict, and how you show up for others.',
  },
  {
    id: 'freewrite',
    label: 'Free write',
    description: 'An open prompt when you just need to put words down.',
  },
];

export function themeLabel(themeIdOrCustom) {
  const found = STARTER_THEMES.find((t) => t.id === themeIdOrCustom);
  return found?.label || String(themeIdOrCustom || '').trim() || 'Free write';
}
