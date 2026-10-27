import { useEffect, useState } from 'react';
import { entriesAPI, insightsAPI } from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import { decryptContent } from '../lib/crypto';
import useCryptoStore from '../store/cryptoStore';

async function buildCorpus(entries, { includePrivate, passphrase }) {
  const out = [];
  for (const entry of entries) {
    if (!entry.encrypted) {
      out.push({
        theme: entry.theme,
        prompt: entry.prompt,
        content: entry.content,
        createdAt: entry.createdAt,
      });
      continue;
    }
    if (!includePrivate || !passphrase) continue;
    try {
      const content = await decryptContent(entry, passphrase);
      out.push({
        theme: entry.theme,
        prompt: entry.prompt,
        content,
        createdAt: entry.createdAt,
      });
    } catch {
      /* skip entries that don't decrypt with this key */
    }
  }
  return out;
}

export default function Insights() {
  const passphrase = useCryptoStore((s) => s.passphrase);
  const unlocked = useCryptoStore((s) => s.unlocked);

  const [insight, setInsight] = useState(null);
  const [insightsEnabled, setInsightsEnabled] = useState(false);
  const [aiMode, setAiMode] = useState('off');
  const [goalsText, setGoalsText] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [counts, setCounts] = useState({ total: 0, public: 0, private: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const data = await insightsAPI.get();
      setInsight(data.insight);
      setInsightsEnabled(Boolean(data.insightsEnabled));
      setAiMode(data.aiMode || 'off');
      const goals = Array.isArray(data.insight?.goals) ? data.insight.goals : [];
      setGoalsText(goals.join('\n'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runGenerate = async (includePrivate) => {
    setGenerating(true);
    setError('');
    setStatus('');
    setConfirmOpen(false);
    try {
      const { entries } = await entriesAPI.list(15);
      const corpus = await buildCorpus(entries, {
        includePrivate,
        passphrase,
      });
      if (corpus.length === 0) {
        throw new Error(
          includePrivate
            ? 'Couldn’t read any entries with this key.'
            : 'No public entries to summarize. Unlock your key to include private ones.',
        );
      }
      const data = await insightsAPI.generate({ entries: corpus });
      setInsight(data.insight);
      setGoalsText((data.insight.goals || []).join('\n'));
      setStatus(`Summary updated from ${corpus.length} ${corpus.length === 1 ? 'entry' : 'entries'}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const startGenerate = async () => {
    setError('');
    try {
      const { entries } = await entriesAPI.list(15);
      const publicCount = entries.filter((e) => !e.encrypted).length;
      const privateCount = entries.filter((e) => e.encrypted).length;
      setCounts({
        total: entries.length,
        public: publicCount,
        private: privateCount,
      });

      if (privateCount === 0) {
        await runGenerate(false);
        return;
      }

      setConfirmOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const saveGoals = async () => {
    setSavingGoals(true);
    setError('');
    try {
      const goals = goalsText
        .split('\n')
        .map((g) => g.trim())
        .filter(Boolean);
      const data = await insightsAPI.updateGoals(goals);
      setInsight(data.insight);
      setStatus('Goals saved — they’ll help shape future prompts.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingGoals(false);
    }
  };

  if (loading) return <p className="text-muted">Loading insights…</p>;

  const bullets = Array.isArray(insight?.bullets) ? insight.bullets : [];
  const sendIfIncludePrivate = counts.public + counts.private;
  const sendIfPublicOnly = counts.public;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Insights</h1>
        <p className="mt-1 text-sm text-muted">
          Summarize recent entries into highlights and goals. Those goals help shape future prompts —
          raw journal text is not reused later.
        </p>
      </div>

      {!insightsEnabled && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {aiMode === 'off' || aiMode === 'prompts' || aiMode === 'generic'
            ? 'AI summaries are turned off in Settings. You can still edit goals below.'
            : 'Summaries aren’t available right now. You can still edit your goals below.'}
        </p>
      )}

      <button
        type="button"
        onClick={startGenerate}
        disabled={generating || !insightsEnabled}
        className="w-full rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leaf-dark disabled:opacity-50 sm:w-auto"
      >
        {generating ? 'Summarizing…' : 'Generate summary'}
      </button>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {status && <p className="text-sm text-muted">{status}</p>}

      <section className="rounded-xl border border-stone-300 bg-white/80 p-5">
        <h2 className="font-display text-xl font-semibold text-ink">Highlights</h2>
        {bullets.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No summary yet.</p>
        ) : (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[1.05rem] leading-relaxed text-ink">
            {bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        {insight?.createdAt && (
          <p className="mt-4 text-xs text-clay">
            From {insight.sourceCount} {insight.sourceCount === 1 ? 'entry' : 'entries'} ·{' '}
            {new Date(insight.createdAt).toLocaleString()}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-stone-300 bg-white/80 p-5">
        <h2 className="font-display text-xl font-semibold text-ink">What you’re working on</h2>
        <p className="mt-1 text-sm text-muted">One goal per line. Used when generating new prompts.</p>
        <textarea
          value={goalsText}
          onChange={(e) => setGoalsText(e.target.value)}
          rows={6}
          className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-leaf"
          placeholder={'Be more present with family\nNotice anxiety earlier in the day'}
        />
        <button
          type="button"
          onClick={saveGoals}
          disabled={savingGoals}
          className="mt-3 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-stone-50 disabled:opacity-60"
        >
          {savingGoals ? 'Saving…' : 'Save goals'}
        </button>
      </section>

      {confirmOpen && (
        <ConfirmModal
          title="Include private entries?"
          confirmLabel={unlocked ? 'Include private' : 'Unlock key first'}
          secondaryLabel="Public only"
          cancelLabel="Cancel"
          busy={generating}
          onCancel={() => setConfirmOpen(false)}
          onSecondary={() => runGenerate(false)}
          onConfirm={() => {
            if (!unlocked) {
              setConfirmOpen(false);
              setError('Enter your encryption key in the top bar, then try again.');
              return;
            }
            runGenerate(true);
          }}
        >
          <p>
            Of your {counts.total} recent {counts.total === 1 ? 'entry' : 'entries'}:{' '}
            <span className="font-medium text-ink">{counts.public} public</span>,{' '}
            <span className="font-medium text-ink">{counts.private} private</span>.
          </p>
          <p className="mt-3">
            Including private ones unlocks them on this device and sends the text for this summary
            only. The server keeps storing private entries encrypted.
          </p>
          {!unlocked && (
            <p className="mt-3 font-medium text-ink">
              Your key isn’t unlocked yet — use the top bar, or continue with public only.
            </p>
          )}
          <p className="mt-4 border-t border-stone-200 pt-3 text-xs text-muted">
            Include private → send up to {sendIfIncludePrivate}{' '}
            {sendIfIncludePrivate === 1 ? 'entry' : 'entries'}
            <br />
            Public only → send {sendIfPublicOnly}{' '}
            {sendIfPublicOnly === 1 ? 'entry' : 'entries'}
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}
