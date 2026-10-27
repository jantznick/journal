# Journal

Self-hosted journaling app: magic-link auth (optional OIDC), themed AI prompts, a simple rich-text editor, optional client-side encryption, and basic AI insights/goals.

## Features (v1)

- **Auth:** magic link + 6-digit OTP (hashed tokens). Optional OIDC (Authentik etc.) linked by email.
- **Write flow:** Generate prompt (uses Settings default focus; chevron = one-time focus) → write → save.
- **Encryption (optional):** thin top banner to unlock a private key; AES-GCM in the browser; key lives in memory until logout.
- **Insights:** summarize non-private entries into bullets + a running goal list that feeds future prompts.
- **Deploy:** full `docker compose` (postgres + backend + frontend/nginx). Local dev uses Compose for Postgres only.

## Local development

```bash
# 1) Postgres
docker compose up -d postgres

# 2) Backend
cp env.example backend/.env
# edit DATABASE_URL / SESSION_SECRET / optional OPENAI_API_KEY / RESEND_* / OIDC_*
cd backend && npm install && npx prisma migrate deploy && npm run dev

# 3) Frontend (another terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173. Without `RESEND_API_KEY`, magic codes/links are printed in the backend console.

## Full Compose deploy (home server)

```bash
cp env.example .env
# set SESSION_SECRET, OPENAI_API_KEY, RESEND_*, FRONTEND_URL=http://your-host
# COOKIE_SECURE=false if serving plain HTTP on the LAN
docker compose up -d --build
```

App: http://localhost (or `HTTP_PORT`). Nginx proxies `/api` to the backend.

### OIDC

When `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, and `OIDC_CLIENT_SECRET` are set, login/register show **Sign in with SSO**.

- Redirect URI must match `OIDC_REDIRECT_URI` (Compose default: `http://localhost/api/auth/oidc/callback`).
- Email claim is required; accounts are linked by email across magic and OIDC.
- **Authentik Launch URL** (auto-start SSO from the Authentik apps list):  
  `https://journal.example.com/api/auth/oidc/start?redirect=1`  
  or the alias `https://journal.example.com/sso`.

### AI models

Default `OPENAI_MODEL=gpt-4o-mini` is fine for prompts and short summaries. For richer summaries later, try `gpt-4o`. Point `OPENAI_BASE_URL` at a local OpenAI-compatible server when you want offline models.

## Encryption notes

- Client derives a key with PBKDF2 (210k iterations) + AES-GCM.
- Encrypted entries show as locked placeholders until the passphrase is entered for the session.
- Encrypted content is **never** sent to OpenAI for insights.

## Project layout

```
backend/     Express API, Prisma, sessions, magic + OIDC, OpenAI
frontend/    Vite React SPA (Tailwind v4)
docker-compose.yml
env.example
```
