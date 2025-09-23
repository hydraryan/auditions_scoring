import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProtectedLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/app';
  // theme: dark by default, dashboard-only
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('dashboard-theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('dashboard-theme', theme);
    } catch {}
  }, [theme]);

  const themeClass = useMemo(() => (theme === 'light' ? 'theme-light' : 'theme-dark'), [theme]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const name = user.username;

  return (
  <div className={`h-screen flex overflow-hidden ${themeClass} ${theme === 'light' ? 'bg-white text-neutral-900' : 'bg-black text-white'}`}>
      {/* Sidebar */}
      <aside className="w-64 hidden sm:flex sm:flex-col bg-neutral-950 border-r border-neutral-800">
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎞️</span>
            <div>
              <div className="text-sm text-neutral-400">Signed in as</div>
              <div className="font-semibold leading-tight">{name}</div>
              <div className="text-neutral-400 text-xs">Director Sahab</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="."
                end
                className={({ isActive }) =>
                  `block px-3 py-2 rounded hover:bg-neutral-900 transition-colors ${isActive ? 'text-netflix-red bg-neutral-900' : 'text-white'}`
                }
              >
                <span className="mr-2">🏠</span> Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="round-1"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded hover:bg-neutral-900 transition-colors ${isActive ? 'text-netflix-red bg-neutral-900' : 'text-white'}`
                }
              >
                <span className="mr-2">🎭</span> Round 1
              </NavLink>
            </li>
            <li>
              <NavLink
                to="round-2"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded hover:bg-neutral-900 transition-colors ${isActive ? 'text-netflix-red bg-neutral-900' : 'text-white'}`
                }
              >
                <span className="mr-2">🗣️</span> Round 2
              </NavLink>
            </li>
            <li>
              <NavLink
                to="round-3"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded hover:bg-neutral-900 transition-colors ${isActive ? 'text-netflix-red bg-neutral-900' : 'text-white'}`
                }
              >
                <span className="mr-2">🎬</span> Round 3
              </NavLink>
            </li>
            <li>
              <NavLink
                to="students"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded hover:bg-neutral-900 transition-colors ${isActive ? 'text-netflix-red bg-neutral-900' : 'text-white'}`
                }
              >
                <span className="mr-2">📝</span> Enter Candidate Detail
              </NavLink>
            </li>
            <li>
              <NavLink
                to="final-scores"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded hover:bg-neutral-900 transition-colors ${isActive ? 'text-netflix-red bg-neutral-900' : 'text-white'}`
                }
              >
                <span className="mr-2">📊</span> View Final Scores
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="p-3 border-t border-neutral-800 space-y-2">
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="w-full px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
            title="Toggle light/dark theme (dashboard only)"
          >
            <span className="mr-1">🌓</span> {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={() => setOpen(true)}
            className="w-full px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
          >
            <span className="mr-1">🔒</span> Change Password
          </button>
          <button
            onClick={logout}
            className="w-full px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
          >
            <span className="mr-1">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
  <div className="flex-1 min-w-0 h-screen flex flex-col">
        <header className="sm:hidden p-3 flex items-center justify-between bg-neutral-900 sticky top-0 z-10">
          <div className="text-sm">
            <span className="text-neutral-400">Welcome,</span> <span className="font-semibold">{name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
              title="Toggle light/dark"
            >
              🌓 {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={() => setOpen(true)}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
            >
              🔒 Password
            </button>
            <button onClick={logout} className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm">
              🚪 Logout
            </button>
          </div>
        </header>
        <main className={`p-4 ${isDashboard ? 'flex-1 overflow-hidden' : 'flex-1 overflow-auto'}`}>
          <Outlet />
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-neutral-900 w-full max-w-sm rounded p-4 space-y-3">
            <h3 className="text-lg font-semibold">Change Password</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm mb-1">Current Password</label>
                <input
                  type="password"
                  className="w-full bg-neutral-800 p-2 rounded"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full bg-neutral-800 p-2 rounded"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                disabled={busy}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setBusy(true);
                    await api.put('/auth/change-password', { oldPassword, newPassword });
                    alert('Password changed successfully.');
                    setOpen(false);
                    setOldPassword('');
                    setNewPassword('');
                  } catch (e: any) {
                    const msg = e?.response?.data?.message || 'Change password failed';
                    alert(msg);
                  } finally {
                    setBusy(false);
                  }
                }}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-60"
                disabled={busy || !oldPassword || !newPassword}
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
