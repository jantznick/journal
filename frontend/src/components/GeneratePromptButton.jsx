import { useEffect, useRef, useState } from 'react';
import ThemeSelect from './ThemeSelect';
import { themeLabel } from '../lib/themes';

/**
 * Split control: primary Generate uses default focus;
 * chevron opens a one-time focus override.
 */
export default function GeneratePromptButton({
  defaultTheme,
  loading,
  onGenerate,
}) {
  const [open, setOpen] = useState(false);
  const [oneOff, setOneOff] = useState(defaultTheme || 'reflection');
  const rootRef = useRef(null);

  useEffect(() => {
    setOneOff(defaultTheme || 'reflection');
  }, [defaultTheme]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="relative inline-flex w-full sm:w-auto" ref={rootRef}>
      <div className="inline-flex w-full overflow-hidden rounded-lg shadow-sm sm:w-auto">
        <button
          type="button"
          disabled={loading}
          onClick={() => onGenerate(defaultTheme)}
          className="flex-1 bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leaf-dark disabled:opacity-60 sm:flex-none"
        >
          {loading ? 'Generating…' : 'Generate prompt'}
        </button>
        <button
          type="button"
          disabled={loading}
          aria-expanded={open}
          aria-label="Generate with a different focus"
          onClick={() => setOpen((v) => !v)}
          className="border-l border-white/25 bg-leaf px-3 text-white hover:bg-leaf-dark disabled:opacity-60"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path fill="currentColor" d="M2.5 4.5 6 8l3.5-3.5z" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 w-full min-w-[16rem] rounded-xl border border-stone-300 bg-white p-4 shadow-lg sm:right-auto sm:w-72">
          <p className="text-sm font-medium text-ink">One-time focus</p>
          <p className="mt-1 text-xs text-muted">
            Uses this for the next prompt only. Your default stays{' '}
            <span className="font-medium text-ink">{themeLabel(defaultTheme)}</span>.
          </p>
          <div className="mt-3">
            <ThemeSelect value={oneOff} onChange={setOneOff} id="one-off-theme" />
          </div>
          <button
            type="button"
            disabled={loading || !String(oneOff || '').trim()}
            onClick={() => {
              onGenerate(oneOff);
              setOpen(false);
            }}
            className="mt-3 w-full rounded-lg bg-ink py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
          >
            Generate once
          </button>
        </div>
      )}
    </div>
  );
}
