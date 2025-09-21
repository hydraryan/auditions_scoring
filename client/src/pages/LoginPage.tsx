import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState<'Aryan' | 'Kunal'>('Aryan');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm p-6 bg-neutral-900 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <label className="block text-sm text-gray-300">Username</label>
        <select
          value={username}
          onChange={(e) => setUsername(e.target.value as 'Aryan' | 'Kunal')}
          className="w-full mt-1 mb-3 p-2 bg-neutral-800 rounded">
          <option value="Aryan">Aryan</option>
          <option value="Kunal">Kunal</option>
        </select>

        <label className="block text-sm text-gray-300">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-1 mb-4 p-2 bg-neutral-800 rounded"
          placeholder="Enter password"
          required
        />
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <button type="submit" className="w-full py-2 rounded bg-netflix-red hover:brightness-110">
          Enter Auditions Portal
        </button>
      </form>
    </div>
  );
}
