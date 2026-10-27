import { useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Authentik / bookmark entry: kick off OIDC immediately.
 * Prefer pointing Authentik Launch URL at /api/auth/oidc/start?redirect=1
 * (full-page redirect sets cookies cleanly). This page is a friendly alias.
 */
export default function Sso() {
  useEffect(() => {
    window.location.replace('/api/auth/oidc/start?redirect=1');
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-muted">Redirecting to sign-in…</p>
      <Link to="/login" className="text-sm text-leaf underline-offset-2 hover:underline">
        Back to login
      </Link>
    </div>
  );
}
