import { useEffect, useState } from 'react';
import { userAPI } from '../api/api';
import ConfirmModal from '../components/ConfirmModal';
import ThemeSelect from '../components/ThemeSelect';
import { countPlaintextEntries, encryptExistingEntries } from '../lib/encryptExisting';
import useAuthStore from '../store/authStore';
import useCryptoStore from '../store/cryptoStore';

const AI_OPTIONS = [
  {
    value: 'off',
    label: 'No AI',
    detail: 'Uses built-in prompts only. Nothing is sent to a model.',
  },
  {
    value: 'generic',
    label: 'Generic AI prompts',
    detail:
      'AI writes prompts from your focus only (e.g. Reflection). No goals, highlights, or journal text are sent.',
  },
  {
    value: 'prompts',
    label: 'Personalized prompts',
    detail:
      'AI writes prompts using your saved goals and highlights. No automatic summaries of your entries.',
  },
  {
    value: 'full',
    label: 'Prompts and summaries',
    detail:
      'AI writes prompts using your goals/highlights, and can summarize entries into new highlights and goals.',
  },
];

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const unlocked = useCryptoStore((s) => s.unlocked);
  const passphrase = useCryptoStore((s) => s.passphrase);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [defaultTheme, setDefaultTheme] = useState(user?.defaultTheme || 'reflection');
  const [aiMode, setAiMode] = useState(user?.aiMode || 'off');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [plainCount, setPlainCount] = useState(null);
  const [plainCountError, setPlainCountError] = useState('');
  const [confirmEncrypt, setConfirmEncrypt] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [encryptProgress, setEncryptProgress] = useState(null);
  const [encryptStatus, setEncryptStatus] = useState('');
  const [encryptError, setEncryptError] = useState('');

  useEffect(() => {
    if (!unlocked) {
      setPlainCount(null);
      setPlainCountError('');
      return;
    }
    let cancelled = false;
    setPlainCountError('');
    countPlaintextEntries()
      .then((n) => {
        if (!cancelled) setPlainCount(n);
      })
      .catch((err) => {
        if (!cancelled) {
          setPlainCount(null);
          setPlainCountError(err.message || 'Could not check entries.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [unlocked]);

  const save = async (e) => {
    e.preventDefault();
    const theme = String(defaultTheme || '').trim();
    if (!theme) {
      setError('Pick a default focus, or choose Other and type one.');
      return;
    }
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const data = await userAPI.updateProfile({
        displayName,
        defaultTheme: theme,
        aiMode,
      });
      setUser(data.user);
      setStatus('Saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const runEncryptExisting = async () => {
    if (!passphrase) return;
    setEncrypting(true);
    setEncryptError('');
    setEncryptStatus('');
    setEncryptProgress({ done: 0, total: plainCount || 0 });
    try {
      const result = await encryptExistingEntries(passphrase, {
        onProgress: (p) => setEncryptProgress(p),
      });
      setPlainCount(result.failures.length);
      if (result.total === 0) {
        setEncryptStatus('Nothing to encrypt — all entries are already private.');
      } else if (result.failures.length === 0) {
        setEncryptStatus(
          result.done === 1
            ? 'Encrypted 1 older entry with your key.'
            : `Encrypted ${result.done} older entries with your key.`,
        );
      } else {
        setEncryptStatus(
          `Encrypted ${result.done} of ${result.total}. ${result.failures.length} failed — try again.`,
        );
        setEncryptError(result.failures[0]?.error || 'Some entries could not be encrypted.');
      }
      setConfirmEncrypt(false);
    } catch (err) {
      setEncryptError(err.message || 'Could not encrypt entries.');
    } finally {
      setEncrypting(false);
      setEncryptProgress(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Profile, writing focus, and how AI is used.</p>
      </div>

      <form onSubmit={save} className="space-y-6 rounded-xl border border-stone-300 bg-white/80 p-4 sm:p-5">
        <div>
          <label className="text-sm font-medium text-ink">Email</label>
          <p className="mt-1 break-all text-sm text-muted">{user?.email}</p>
        </div>
        <div>
          <label htmlFor="displayName" className="text-sm font-medium text-ink">
            Display name
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-leaf"
          />
        </div>
        <div>
          <label htmlFor="defaultTheme" className="text-sm font-medium text-ink">
            Default focus
          </label>
          <p className="mt-1 text-xs text-muted">
            Used when you tap Generate prompt. One-time overrides live under the arrow next to that
            button.
          </p>
          <div className="mt-2">
            <ThemeSelect id="defaultTheme" value={defaultTheme} onChange={setDefaultTheme} />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-ink">AI</legend>
          <p className="text-xs text-muted">
            Choose whether a language model helps with prompts and summaries. Turning AI off still
            lets you journal with built-in prompts.
          </p>
          <div className="space-y-2">
            {AI_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-3 ${
                  aiMode === opt.value
                    ? 'border-leaf bg-lime-50/60'
                    : 'border-stone-300 bg-white hover:border-stone-400'
                }`}
              >
                <input
                  type="radio"
                  name="aiMode"
                  value={opt.value}
                  checked={aiMode === opt.value}
                  onChange={() => setAiMode(opt.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{opt.detail}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-800">{error}</p>}
        {status && <p className="text-sm text-muted">{status}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white hover:bg-leaf-dark disabled:opacity-60 sm:w-auto"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>

      <section className="space-y-3 rounded-xl border border-stone-300 bg-white/80 p-4 sm:p-5">
        <h2 className="font-display text-xl font-semibold text-ink">Privacy</h2>
        {!unlocked ? (
          <p className="text-sm leading-relaxed text-muted">
            Unlock an encryption key in the top bar, then you can encrypt older entries that were
            saved as plain text.
          </p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted">
              Your key is unlocked for this session. New private entries use it automatically. Older
              plain-text entries stay readable on the server until you encrypt them here.
            </p>
            {plainCountError && <p className="text-sm text-red-800">{plainCountError}</p>}
            {encryptError && <p className="text-sm text-red-800">{encryptError}</p>}
            {encryptStatus && <p className="text-sm text-muted">{encryptStatus}</p>}
            {plainCount === null && !plainCountError ? (
              <p className="text-sm text-muted">Checking older entries…</p>
            ) : plainCount === 0 ? (
              <p className="text-sm text-muted">All saved entries are already private.</p>
            ) : plainCount > 0 ? (
              <button
                type="button"
                disabled={encrypting}
                onClick={() => {
                  setEncryptError('');
                  setConfirmEncrypt(true);
                }}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-stone-50 disabled:opacity-60"
              >
                {plainCount === 1
                  ? 'Encrypt 1 older entry'
                  : `Encrypt ${plainCount} older entries`}
              </button>
            ) : null}
          </>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-stone-300 bg-white/70 p-4 sm:p-5">
        <h2 className="font-display text-xl font-semibold text-ink">How Journal works</h2>
        <ul className="space-y-3 text-sm leading-relaxed text-muted">
          <li>
            <span className="font-medium text-ink">Write.</span> Generate a prompt from your default
            focus (or a one-time focus), then write in a simple editor.
          </li>
          <li>
            <span className="font-medium text-ink">Privacy.</span> Optional encryption happens in
            your browser before save. Unlock a key in the top bar — it stays in memory until you
            sign out. Store that key in a password manager. After unlocking, Settings can encrypt
            older plain-text entries with the same key.
          </li>
          <li>
            <span className="font-medium text-ink">Insights.</span> Summaries turn recent entries
            into short highlights and a goal list. Personalized prompt modes can reuse those — not
            your raw journal text again. Generic AI prompts never send that data.
          </li>
          <li>
            <span className="font-medium text-ink">Private + AI.</span> Including private entries in
            a summary asks first, then decrypts on this device for that request only.
          </li>
        </ul>
      </section>

      {confirmEncrypt && (
        <ConfirmModal
          title="Encrypt older entries?"
          confirmLabel={
            encryptProgress
              ? `Encrypting ${encryptProgress.done}/${encryptProgress.total}…`
              : 'Encrypt with this key'
          }
          cancelLabel="Cancel"
          busy={encrypting}
          onCancel={() => !encrypting && setConfirmEncrypt(false)}
          onConfirm={runEncryptExisting}
        >
          <p>
            {plainCount === 1
              ? '1 plain-text entry will be encrypted in this browser with your current key, then stored only as ciphertext.'
              : `${plainCount} plain-text entries will be encrypted in this browser with your current key, then stored only as ciphertext.`}
          </p>
          <p className="mt-2">
            You will need this same key to read them later. Make sure it is saved in a password
            manager before continuing.
          </p>
        </ConfirmModal>
      )}
    </div>
  );
}
