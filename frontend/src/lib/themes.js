/** Client-side copy of starter themes for dropdowns (labels only — no tech ids in UI). */
export const STARTER_THEMES = [
  { id: 'reflection', label: 'Reflection' },
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'anxiety', label: 'Anxiety & calm' },
  { id: 'goals', label: 'Goals & progress' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'freewrite', label: 'Free write' },
];

export function isStarterTheme(value) {
  return STARTER_THEMES.some((t) => t.id === value);
}

export function themeLabel(value) {
  const found = STARTER_THEMES.find((t) => t.id === value);
  return found?.label || String(value || '').trim() || 'Free write';
}
