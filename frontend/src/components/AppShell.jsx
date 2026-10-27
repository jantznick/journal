import { NavLink, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import EncryptionBanner from './EncryptionBanner';
import useAuthStore from '../store/authStore';
import useCryptoStore from '../store/cryptoStore';

const links = [
  { to: '/app', label: 'Write', end: true },
  { to: '/app/entries', label: 'Entries' },
  { to: '/app/insights', label: 'Insights' },
  { to: '/app/settings', label: 'Settings' },
];

export default function AppShell({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const clearCrypto = useCryptoStore((s) => s.clear);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      /* still clear client state */
    }
    clearCrypto();
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <EncryptionBanner />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-20 pt-5 sm:px-6 sm:pb-16 sm:pt-6">
        <header className="mb-6 border-b border-stone-300/70 pb-4 sm:mb-8 sm:pb-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Journal
              </p>
              <p className="mt-1 truncate text-sm text-muted">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 pt-1 text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
            >
              Sign out
            </button>
          </div>
          <nav className="-mx-1 mt-4 flex gap-1 overflow-x-auto pb-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-leaf text-white'
                      : 'text-muted hover:bg-stone-200/70 hover:text-ink'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
