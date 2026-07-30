'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type AuthState = {
  token: string | null;
  role: string | null;
  loading: boolean;
  login: (token: string, role: string, refreshToken?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(localStorage.getItem('amrutam_token'));
    setRole(localStorage.getItem('amrutam_role'));
    setLoading(false);
  }, []);

  function login(newToken: string, newRole: string, refreshToken?: string) {
    localStorage.setItem('amrutam_token', newToken);
    localStorage.setItem('amrutam_role', newRole);
    if (refreshToken) localStorage.setItem('amrutam_refresh_token', refreshToken); // NEW
    setToken(newToken);
    setRole(newRole);
  }

  function logout() {
    localStorage.removeItem('amrutam_token');
    localStorage.removeItem('amrutam_role');
    localStorage.removeItem('amrutam_refresh_token'); // NEW
    setToken(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ token, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}