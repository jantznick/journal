import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { entriesAPI } from '../api/api';
import GeneratePromptButton from '../components/GeneratePromptButton';
import RichEditor from '../components/RichEditor';
import Toggle from '../components/Toggle';
import { encryptContent } from '../lib/crypto';
import { themeLabel } from '../lib/themes';
import useAuthStore from '../store/authStore';
import useCryptoStore from '../store/cryptoStore';

function isBlankHtml(html) {
  const text = String(html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return !text;
}

export default function Write() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const passphrase = useCryptoStore((s) => s.passphrase);
  const unlocked = useCryptoStore((s) => s.unlocked);

  const defaultTheme = user?.defaultTheme || 'reflection';
  const [sessionTheme, setSessionTheme] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [content, setContent] = useState('');
  const [keepPrivate, setKeepPrivate] = useState(unlocked);
  const [error, setError] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [saving, setSaving] = useState(false);

  // When the encryption key is unlocked, new entries default to private.
  useEffect(() => {
    setKeepPrivate(unlocked);
  }, [unlocked]);

  const activeTheme = sessionTheme || defaultTheme;

  const generatePrompt = async (theme) => {
    const focus = String(theme || '').trim();
    if (!focus) {
      setError('Choose a focus in Settings, or pick a one-time focus from the menu.');
      return;
    }
    setError('');
    setLoadingPrompt(true);
    try {
      const data = await entriesAPI.prompt(focus);
      setPrompt(data.prompt);
      setSessionTheme(focus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPrompt(false);
    }
  };

  const save = async () => {
    if (!prompt.trim()) {
      setError('Generate a prompt to get started.');
      return;
    }
    if (isBlankHtml(content)) {
      setError('Write something before saving.');
      return;
    }
    if (keepPrivate && !passphrase) {
      setError('Turn on your encryption key in the top bar first.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let payload = {
        theme: activeTheme,
        prompt: prompt.trim(),
        content,
        encrypted: false,
      };

      if (keepPrivate) {
        const enc = await encryptContent(content, passphrase);
        payload = {
          ...payload,
          content: enc.content,
          encrypted: true,
          iv: enc.iv,
          salt: enc.salt,
        };
      }

      const { entry } = await entriesAPI.create(payload);
      navigate(`/app/entries/${entry.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">New entry</h1>
        <p className="mt-1 text-sm text-muted">
          Default focus: <span className="font-medium text-ink">{themeLabel(defaultTheme)}</span>
          {' · '}
          <Link to="/app/settings" className="underline-offset-2 hover:underline">
            Change in Settings
          </Link>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <GeneratePromptButton
          defaultTheme={defaultTheme}
          loading={loadingPrompt}
          onGenerate={generatePrompt}
        />
        {prompt && (
          <button
            type="button"
            disabled={loadingPrompt}
            onClick={() => generatePrompt(activeTheme)}
            className="text-sm font-medium text-muted underline-offset-2 hover:text-ink hover:underline disabled:opacity-50"
          >
            Try another
          </button>
        )}
      </div>

      {prompt ? (
        <section className="rounded-xl border border-stone-300 bg-white/80 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your prompt</p>
          <p className="mt-2 font-display text-xl font-medium leading-snug text-ink">{prompt}</p>
          {sessionTheme && sessionTheme !== defaultTheme && (
            <p className="mt-2 text-xs text-muted">One-time focus: {themeLabel(sessionTheme)}</p>
          )}
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white/40 px-4 py-8 text-center text-sm text-muted">
          Hit Generate prompt when you&apos;re ready to write.
        </p>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Your writing</h2>
        <RichEditor
          value={content}
          onChange={setContent}
          placeholder={prompt ? 'Start writing…' : 'Generate a prompt first…'}
        />
      </section>

      <div className="rounded-xl border border-stone-300 bg-white/70 px-4 py-3">
        <Toggle
          id="keep-private"
          checked={keepPrivate}
          onChange={setKeepPrivate}
          label="Keep this entry private"
          description={
            unlocked
              ? 'On by default while your key is unlocked. Encrypted before it leaves this device.'
              : keepPrivate
                ? 'Turn on your key in the top bar before saving.'
                : 'Optional — unlock a key in the top bar to encrypt entries.'
          }
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving || !prompt}
        className="w-full rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50 sm:w-auto"
      >
        {saving ? 'Saving…' : 'Save entry'}
      </button>
    </div>
  );
}
