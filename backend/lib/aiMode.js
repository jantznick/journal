export const AI_MODES = ['off', 'generic', 'prompts', 'full'];

export function normalizeAiMode(value) {
  const mode = String(value || 'off').trim().toLowerCase();
  return AI_MODES.includes(mode) ? mode : 'off';
}

/** Any mode that may call the model for journaling prompts. */
export function promptsAllowed(aiMode) {
  const mode = normalizeAiMode(aiMode);
  return mode === 'generic' || mode === 'prompts' || mode === 'full';
}

/**
 * Whether prompt generation may include goals / insight highlights.
 * `generic` uses AI but never sends personal journal-derived data.
 */
export function personalPromptContextAllowed(aiMode) {
  const mode = normalizeAiMode(aiMode);
  return mode === 'prompts' || mode === 'full';
}

export function insightsAllowed(aiMode) {
  return normalizeAiMode(aiMode) === 'full';
}
