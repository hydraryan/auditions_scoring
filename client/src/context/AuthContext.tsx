import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

type User = { username: 'Aryan' | 'Kunal'; token: string; } | null;

type AuthContextType = {
  user: User;
  login: (username: 'Aryan' | 'Kunal', password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored) as User;
      setUser(parsed);
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('auth', JSON.stringify(user));
    else localStorage.removeItem('auth');
  }, [user]);

  const login: AuthContextType['login'] = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const token = res.data.token as string;
    setUser({ username, token });
    navigate('/app');
  };

  const logout = () => {
    setUser(null);
    navigate('/login');
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
