import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api/api';
import useAuthStore from '../store/authStore';

const urlTokensInFlight = new Set();

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, isAuthenticated, isLoading } = useAuthStore();

  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState(() => {
    const e = searchParams.get('error');
    return e ? `Sign-in failed (${e.replace(/_/g, ' ')})` : '';
  });
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [oidcEnabled, setOidcEnabled] = useState(false);

  useEffect(() => {
    authAPI.providers().then((p) => setOidcEnabled(Boolean(p.oidc))).catch(() => {});
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token || urlTokensInFlight.has(token)) return;
    urlTokensInFlight.add(token);
    setLoading(true);
    authAPI
      .magicVerify(token)
      .then((data) => {
        setUser(data.user);
        navigate('/app', { replace: true });
      })
      .catch((err) => {
        urlTokensInFlight.delete(token);
        setError(err.message);
        setLoading(false);
      });
  }, [searchParams, setUser, navigate]);

  if (!isLoading && isAuthenticated && !searchParams.get('token')) {
    return <Navigate to="/app" replace />;
  }

  const requestLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter your email first');
      return;
    }
    setError('');
    setRequesting(true);
    try {
      await authAPI.magicLink(email);
      setRequested(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authAPI.magicCode(email, code);
      setUser(data.user);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const startOidc = async () => {
    setError('');
    try {
      const { authUrl } = await authAPI.oidcStart();
      window.location.href = authUrl;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-300 bg-white/85 p-8 shadow-sm">
        <Link to="/" className="font-display text-2xl font-semibold text-ink">
          Journal
        </Link>
        <h1 className="mt-3 text-xl font-semibold text-ink">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          We&apos;ll email a magic link and 6-digit code. No password.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}

        {!requested ? (
          <form onSubmit={requestLink} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-leaf"
            />
            <button
              type="submit"
              disabled={requesting || loading}
              className="w-full rounded-lg bg-leaf py-2.5 text-sm font-semibold text-white hover:bg-leaf-dark disabled:opacity-60"
            >
              {requesting ? 'Sending…' : 'Email me a link'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              Check your inbox (and the server console in local dev). Enter the code or open the
              link.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 tracking-widest outline-none focus:border-leaf"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-leaf py-2.5 text-sm font-semibold text-white hover:bg-leaf-dark disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in with code'}
            </button>
            <button
              type="button"
              onClick={() => setRequested(false)}
              className="w-full text-sm text-muted underline-offset-2 hover:underline"
            >
              Use a different email
            </button>
          </form>
        )}

        {oidcEnabled && (
          <div className="mt-6 border-t border-stone-200 pt-6">
            <button
              type="button"
              onClick={startOidc}
              className="w-full rounded-lg border border-stone-400 bg-white py-2.5 text-sm font-semibold text-ink hover:bg-stone-50"
            >
              Sign in with SSO
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="font-medium text-leaf hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
