import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import loginBg from '../assets/login_bg.png';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState<'Aryan' | 'Kunal'>('Aryan');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setBusy(true);
      await login(username, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center text-white p-4 overflow-hidden">
      {/* Background image layer */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: `url(${loginBg})` }}
        aria-hidden="true"
      />
      {/* Subtle vignette and grid for depth */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} aria-hidden="true" />

      {/* Accent glow */}
      <div className="pointer-events-none absolute -z-0 blur-3xl w-[520px] h-[520px] rounded-full bg-red-600/20 top-1/4 left-1/2 -translate-x-1/2" />

      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-sm p-[1px] rounded-[20px] bg-gradient-to-br from-white/20 via-white/10 to-transparent shadow-2xl"
        aria-labelledby="login-title"
      >
        <div className="rounded-[20px] bg-black/50 backdrop-blur-xl p-6 md:p-8 border border-white/10 will-change-transform transition-transform duration-300 ease-out hover:scale-[1.01]">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center shadow-inner">🎬</div>
            <div>
              <h1 id="login-title" className="text-2xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">Director Login</span>
              </h1>
              <p className="text-sm text-neutral-300/90">Sign in to access the scoring dashboard</p>
            </div>
          </div>

          <label className="block text-sm text-neutral-300 mb-1" htmlFor="username">Username</label>
          <select
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value as 'Aryan' | 'Kunal')}
            className="w-full mb-4 px-3 py-2 rounded-md border border-white/10 bg-black/40 backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 transition"
          >
            <option value="Aryan">Aryan</option>
            <option value="Kunal">Kunal</option>
          </select>

          <div className="mb-2 relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              placeholder="Enter password"
              required
              className="pr-14"
              error={error || undefined}
            />
            {/* Show/Hide toggle */}
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-[34px] text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mb-4" role="alert">{error}</p>}

          <div className="mt-4 flex justify-center">
            <Button type="submit" size="sm" disabled={busy} loading={busy}>
              {busy ? 'Signing in…' : 'Login'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
