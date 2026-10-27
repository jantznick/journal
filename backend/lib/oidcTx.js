import crypto from 'crypto';
import { sessionCookieOptions } from './sessionCookie.js';

const COOKIE_NAME = 'journal_oidc';
const MAX_AGE_MS = 10 * 60 * 1000;

function secret() {
  return process.env.SESSION_SECRET || 'dev-only-change-me';
}

function sign(body) {
  return crypto.createHmac('sha256', secret()).update(body).digest('base64url');
}

/** Short-lived signed cookie so PKCE/state survive Authentik redirect (session alone is flaky behind proxies). */
export function setOidcTxCookie(res, { state, codeVerifier }) {
  const payload = {
    state,
    codeVerifier,
    createdAt: Date.now(),
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const value = `${body}.${sign(body)}`;
  const base = sessionCookieOptions();
  res.cookie(COOKIE_NAME, value, {
    ...base,
    maxAge: MAX_AGE_MS,
  });
}

export function clearOidcTxCookie(res) {
  const base = sessionCookieOptions();
  res.clearCookie(COOKIE_NAME, { ...base, maxAge: 0 });
}

export function readOidcTxCookie(req) {
  const raw = req.cookies?.[COOKIE_NAME];
  if (!raw || typeof raw !== 'string') return null;

  const [body, sig] = raw.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload?.state || !payload?.codeVerifier) return null;
    if (Date.now() - Number(payload.createdAt || 0) > MAX_AGE_MS) return null;
    return payload;
  } catch {
    return null;
  }
}
