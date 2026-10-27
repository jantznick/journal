import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { entriesAPI } from '../api/api';
import { themeLabel } from '../lib/themes';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function Entries() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    entriesAPI
      .list()
      .then((data) => setEntries(data.entries || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted">Loading entries…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Entries</h1>
          <p className="mt-1 text-sm text-muted">Everything you’ve written so far.</p>
        </div>
        <Link
          to="/app"
          className="inline-flex w-full items-center justify-center rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leaf-dark sm:w-auto"
        >
          New entry
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white/50 px-4 py-10 text-center text-muted">
          No entries yet. Start a new one when you’re ready.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-300 bg-white/80">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link to={`/app/entries/${entry.id}`} className="block px-4 py-4 hover:bg-stone-50">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink">{formatDate(entry.createdAt)}</p>
                  {entry.encrypted && (
                    <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[11px] font-semibold text-white">
                      Private
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted">{themeLabel(entry.theme)}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink/80">{entry.prompt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
