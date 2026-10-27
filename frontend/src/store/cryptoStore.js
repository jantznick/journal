import { create } from 'zustand';

/**
 * Encryption passphrase lives in memory only for the browser session.
 * Cleared on logout. Never written to localStorage.
 */
const useCryptoStore = create((set, get) => ({
  passphrase: null,
  unlocked: false,
  setPassphrase: (passphrase) =>
    set({
      passphrase: passphrase ? String(passphrase) : null,
      unlocked: Boolean(passphrase),
    }),
  clear: () => set({ passphrase: null, unlocked: false }),
  getPassphrase: () => get().passphrase,
}));

export default useCryptoStore;
