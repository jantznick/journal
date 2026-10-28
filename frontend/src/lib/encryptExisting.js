import { entriesAPI } from '../api/api';
import { encryptContent } from './crypto';

const PAGE = 50;

/** Load every plaintext entry (paginated). Collect before mutating. */
export async function listPlaintextEntries() {
  const all = [];
  let offset = 0;
  for (;;) {
    const { entries } = await entriesAPI.list({
      limit: PAGE,
      offset,
      encrypted: false,
    });
    all.push(...entries);
    if (entries.length < PAGE) break;
    offset += entries.length;
  }
  return all;
}

/** Count plaintext entries without loading full content pages beyond the first. */
export async function countPlaintextEntries() {
  const { total } = await entriesAPI.list({ limit: 1, offset: 0, encrypted: false });
  return Number(total) || 0;
}

/**
 * Encrypt every plaintext entry with the session passphrase.
 * Returns { total, done, failures }.
 */
export async function encryptExistingEntries(passphrase, { onProgress } = {}) {
  if (!passphrase) throw new Error('Passphrase required to encrypt');

  const entries = await listPlaintextEntries();
  let done = 0;
  const failures = [];

  for (const entry of entries) {
    try {
      const enc = await encryptContent(entry.content, passphrase);
      await entriesAPI.update(entry.id, {
        content: enc.content,
        encrypted: true,
        iv: enc.iv,
        salt: enc.salt,
      });
      done += 1;
      onProgress?.({ done, total: entries.length });
    } catch (err) {
      failures.push({ id: entry.id, error: err.message || 'Failed' });
    }
  }

  return { total: entries.length, done, failures };
}
