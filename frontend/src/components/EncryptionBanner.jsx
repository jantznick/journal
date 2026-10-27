import { useState } from 'react';
import useCryptoStore from '../store/cryptoStore';

/**
 * Thin full-width top banner: encryption status + single place to enter the key.
 */
export default function EncryptionBanner() {
  const { unlocked, setPassphrase, clear } = useCryptoStore();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setPassphrase(value);
    setValue('');
    setEditing(false);
  };

  if (unlocked && !editing) {
    return (
      <div className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-ink px-3 py-2 text-center text-xs text-white sm:text-sm">
        <span>Private mode on — new entries lock with your key</span>
        <span className="hidden text-white/40 sm:inline">|</span>
        <button
          type="button"
          onClick={clear}
          className="font-medium underline-offset-2 hover:underline"
        >
          Turn off
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <form
        onSubmit={submit}
        className="flex w-full flex-col items-stretch gap-2 bg-ink px-3 py-2 text-sm text-white sm:flex-row sm:flex-wrap sm:items-center sm:justify-center"
      >
        <span className="text-center text-xs text-white/80 sm:text-sm">Enter your encryption key</span>
        <input
          type="password"
          autoComplete="off"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Key from your password manager"
          className="rounded border-0 bg-white/15 px-2.5 py-2 text-white placeholder:text-white/50 outline-none focus:bg-white/25 sm:max-w-xs sm:py-1"
        />
        <div className="flex justify-center gap-3">
          <button type="submit" className="font-semibold underline-offset-2 hover:underline">
            Unlock
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValue('');
            }}
            className="text-white/70 hover:text-white"
            aria-label="Cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-ink px-3 py-2 text-center text-xs text-white sm:text-sm">
      <span>Entries stay readable — add a private key anytime</span>
      <span className="hidden text-white/40 sm:inline">|</span>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="font-medium underline-offset-2 hover:underline"
      >
        Use encryption key
      </button>
    </div>
  );
}
