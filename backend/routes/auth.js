import { Router } from 'express';
import { generateRawToken, generateOtp6, hashToken } from '../lib/tokens.js';
import { sendMagicLinkEmail, sendMagicRegisterEmail } from '../lib/email.js';
import { prisma } from '../lib/prisma.js';
import { sessionCookieOptions } from '../lib/sessionCookie.js';
import {
  isOidcConfigured,
  initializeOIDC,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  generateState,
  generateCodeVerifier,
} from '../lib/oidc.js';
import { setOidcTxCookie, readOidcTxCookie, clearOidcTxCookie } from '../lib/oidcTx.js';

const router = Router();

const MAGIC_EXPIRY_MS = 15 * 60 * 1000;

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function frontendUrl() {
  const first = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  return first.replace(/\/+$/, '');
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName || null,
    defaultTheme: user.defaultTheme || 'reflection',
    aiMode: user.aiMode || 'off',
  };
}

async function establishSession(req, user) {
  req.session.userId = user.id;
  await new Promise((resolve, reject) => {
    req.session.save((err) => (err ? reject(err) : resolve()));
  });
}

const magicLinkGenericMessage = {
  ok: true,
  message: 'If an account exists for that email, you will receive a sign-in link.',
};

const magicRegisterRequestGeneric = {
  ok: true,
  message: 'If this email can receive mail, you will receive a link shortly.',
};

async function issueMagicLoginTokenAndEmail(user, email) {
  await prisma.magicLoginToken.deleteMany({ where: { userId: user.id } });
  const raw = generateRawToken();
  const otp = generateOtp6();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + MAGIC_EXPIRY_MS);
  await prisma.magicLoginToken.create({
    data: { userId: user.id, tokenHash, otpHash: hashToken(otp), expiresAt },
  });
  const magicUrl = `${frontendUrl()}/login?token=${encodeURIComponent(raw)}`;
  await sendMagicLinkEmail({ to: email, magicUrl, code: otp });
}

async function fulfillMagicRegisterAndSession(req, res, record) {
  const already = await prisma.user.findUnique({ where: { email: record.email } });
  if (already) {
    await prisma.magicRegisterToken.delete({ where: { id: record.id } });
    return res.status(409).json({ error: 'An account already exists with this email. Sign in instead.' });
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email: record.email },
      select: { id: true, email: true, displayName: true, defaultTheme: true, aiMode: true },
    });
    await tx.magicRegisterToken.delete({ where: { id: record.id } });
    return created;
  });

  await establishSession(req, user);
  return res.status(201).json({ user: publicUser(user) });
}

router.get('/providers', (_req, res) => {
  res.json({
    magic: true,
    oidc: isOidcConfigured(),
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[auth] session destroy:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.clearCookie('connect.sid', { ...sessionCookieOptions(), maxAge: 0 });
    return res.json({ ok: true });
  });
});

router.get('/me', async (req, res) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, displayName: true, defaultTheme: true, aiMode: true },
  });

  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.json({ user: publicUser(user) });
});

router.post('/magic-link', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    return res.json(magicLinkGenericMessage);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json(magicLinkGenericMessage);
  }

  await issueMagicLoginTokenAndEmail(user, email);
  return res.json(magicLinkGenericMessage);
});

router.post('/magic-register-link', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    return res.json(magicRegisterRequestGeneric);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await issueMagicLoginTokenAndEmail(existing, email);
    return res.json(magicRegisterRequestGeneric);
  }

  await prisma.magicRegisterToken.deleteMany({ where: { email } });

  const raw = generateRawToken();
  const otp = generateOtp6();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + MAGIC_EXPIRY_MS);

  await prisma.magicRegisterToken.create({
    data: { email, tokenHash, otpHash: hashToken(otp), expiresAt },
  });

  const registerUrl = `${frontendUrl()}/register?token=${encodeURIComponent(raw)}`;
  await sendMagicRegisterEmail({ to: email, registerUrl, code: otp });

  return res.json(magicRegisterRequestGeneric);
});

router.post('/magic-register-verify', async (req, res) => {
  const token = req.body?.token;
  if (typeof token !== 'string' || !token.trim()) {
    return res.status(400).json({ error: 'Invalid or expired sign-up link' });
  }

  const tokenHash = hashToken(token.trim());
  const record = await prisma.magicRegisterToken.findUnique({ where: { tokenHash } });
  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired sign-up link' });
  }

  try {
    return await fulfillMagicRegisterAndSession(req, res, record);
  } catch (e) {
    console.error('[auth] magic register verify:', e);
    return res.status(500).json({ error: 'Could not create account' });
  }
});

router.post('/magic-code', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const digits = String(req.body?.code ?? '').replace(/\D/g, '');

  if (!isValidEmail(email) || digits.length !== 6) {
    return res.status(400).json({ error: 'Enter the 6-digit code from your email.' });
  }

  const codeHash = hashToken(digits);
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const loginTok = await prisma.magicLoginToken.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (loginTok && loginTok.expiresAt >= new Date() && loginTok.otpHash === codeHash) {
      try {
        await prisma.magicLoginToken.delete({ where: { id: loginTok.id } });
        await establishSession(req, user);
        return res.json({ user: publicUser(user) });
      } catch (e) {
        console.error('[auth] session save after magic code:', e);
        return res.status(500).json({ error: 'Could not create session' });
      }
    }
  }

  const regTok = await prisma.magicRegisterToken.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  if (regTok && regTok.expiresAt >= new Date() && regTok.otpHash === codeHash) {
    try {
      return await fulfillMagicRegisterAndSession(req, res, regTok);
    } catch (e) {
      console.error('[auth] magic-code register:', e);
      return res.status(500).json({ error: 'Could not create account' });
    }
  }

  return res.status(400).json({ error: 'Invalid or expired code' });
});

router.post('/magic-verify', async (req, res) => {
  const token = req.body?.token;
  if (typeof token !== 'string' || !token.trim()) {
    return res.status(400).json({ error: 'Invalid or expired sign-in link' });
  }

  const tokenHash = hashToken(token.trim());
  const record = await prisma.magicLoginToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired sign-in link' });
  }

  await prisma.magicLoginToken.delete({ where: { id: record.id } });

  try {
    await establishSession(req, record.user);
    return res.json({ user: publicUser(record.user) });
  } catch (e) {
    console.error('[auth] session save after magic:', e);
    return res.status(500).json({ error: 'Could not create session' });
  }
});

/** Start OIDC login — PKCE/state in a short-lived signed cookie (survives Authentik redirect). */
router.get('/oidc/start', async (req, res) => {
  if (!isOidcConfigured()) {
    return res.status(404).json({ error: 'OIDC is not configured' });
  }

  try {
    await initializeOIDC();
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    setOidcTxCookie(res, { state, codeVerifier });
    // Keep a session copy as a secondary source when the cookie round-trips fine.
    req.session.oidc = { state, codeVerifier, createdAt: Date.now() };
    await new Promise((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });
    const authUrl = await buildAuthorizationUrl(state, codeVerifier);
    // ?redirect=1 → 302 to Authentik (use as Authentik Launch URL).
    // Default stays JSON for the in-app "Sign in with SSO" button.
    const wantsRedirect =
      req.query.redirect === '1' ||
      req.query.redirect === 'true' ||
      String(req.query.redirect || '').toLowerCase() === 'yes';
    if (wantsRedirect) {
      return res.redirect(authUrl.href);
    }
    return res.json({ authUrl: authUrl.href });
  } catch (e) {
    console.error('[auth] oidc start:', e);
    return res.status(500).json({
      error: 'Failed to start OIDC login',
      detail: e?.message || String(e),
    });
  }
});

router.get('/oidc/callback', async (req, res) => {
  const fe = frontendUrl();
  if (!isOidcConfigured()) {
    return res.redirect(`${fe}/login?error=oidc_disabled`);
  }

  try {
    const { code, state, error } = req.query;
    if (error) {
      clearOidcTxCookie(res);
      return res.redirect(`${fe}/login?error=${encodeURIComponent(String(error))}`);
    }
    if (!code || !state) {
      clearOidcTxCookie(res);
      return res.redirect(`${fe}/login?error=missing_code`);
    }

    const fromCookie = readOidcTxCookie(req);
    const fromSession = req.session?.oidc;
    const stored =
      fromCookie?.state === state
        ? fromCookie
        : fromSession?.state === state
          ? fromSession
          : null;

    if (!stored) {
      clearOidcTxCookie(res);
      return res.redirect(`${fe}/login?error=invalid_state`);
    }

    const codeVerifier = stored.codeVerifier;
    clearOidcTxCookie(res);
    if (req.session?.oidc) delete req.session.oidc;

    // Use configured redirect URI so token exchange matches Authentik even when
    // proxies rewrite X-Forwarded-Proto to http on the internal hop.
    const redirectBase = (process.env.OIDC_REDIRECT_URI || '').replace(/\/+$/, '');
    const currentUrl = redirectBase
      ? `${redirectBase}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`
      : (() => {
          const host = req.get('x-forwarded-host') || req.get('host');
          const proto = (req.get('x-forwarded-proto') || req.protocol || 'https')
            .split(',')[0]
            .trim();
          return `${proto}://${host}${req.originalUrl}`;
        })();

    const tokens = await exchangeCodeForTokens(currentUrl, codeVerifier, state);
    const claims = typeof tokens.claims === 'function' ? tokens.claims() : null;
    const email = normalizeEmail(claims?.email);
    const sub = claims?.sub ? String(claims.sub) : null;
    const displayName = claims?.name || claims?.preferred_username || null;

    if (!email || !isValidEmail(email)) {
      return res.redirect(`${fe}/login?error=oidc_email_required`);
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user && sub) {
      user = await prisma.user.findUnique({ where: { oidcSub: sub } });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          oidcSub: sub,
          displayName,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          oidcSub: user.oidcSub || sub,
          displayName: user.displayName || displayName,
        },
      });
    }

    await establishSession(req, user);
    return res.redirect(`${fe}/app`);
  } catch (e) {
    console.error('[auth] oidc callback:', e);
    clearOidcTxCookie(res);
    return res.redirect(`${fe}/login?error=oidc_failed`);
  }
});

export default router;
