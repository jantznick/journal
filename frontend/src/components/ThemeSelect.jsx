import { STARTER_THEMES, isStarterTheme } from '../lib/themes';

/**
 * Dropdown of friendly theme labels + Other for a custom phrase.
 * `value` is a starter id or a custom string.
 */
export default function ThemeSelect({
  value,
  onChange,
  id = 'theme-select',
  className = '',
}) {
  const isOther = !isStarterTheme(value);
  const selectValue = isOther ? '__other__' : value;

  return (
    <div className={`space-y-2 ${className}`}>
      <select
        id={id}
        value={selectValue}
        onChange={(e) => {
          if (e.target.value === '__other__') {
            onChange('');
          } else {
            onChange(e.target.value);
          }
        }}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-leaf"
      >
        {STARTER_THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
        <option value="__other__">Other…</option>
      </select>
      {isOther && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What do you want to focus on?"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-leaf"
          autoFocus
        />
      )}
    </div>
  );
}
