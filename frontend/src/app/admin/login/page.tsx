'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

// JWT payload sirf client-side redirect-decision ke liye decode kar rahe hain —
// asli authorization hamesha backend pe hoti hai (yeh sirf UI convenience hai)
function decodeRole(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || '';
  } catch {
    return '';
  }
}

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // MFA state — agar admin account pe MFA enabled hai, wahi flow reuse karte hain
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const finalizeLogin = (accessToken: string, refreshToken?: string) => {
    const role = decodeRole(accessToken);

    if (role !== 'admin') {
      // Zaroori: is account ko session mein store hi mat karo — koi bhi patient/doctor
      // is page ka use karke apna normal session overwrite nahi kar sakta, aur na hi
      // galti se admin area access kar sakta hai.
      setError('This login is for admin accounts only. Please use the regular login page.');
      return;
    }

    login(accessToken, role, refreshToken);
    router.push('/admin');
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { status, data } = await apiCall('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    setLoading(false);

    if (status !== 200) {
      setError(data.message || 'Login failed');
      return;
    }

    if (data.data.mfaRequired) {
      setTempToken(data.data.tempToken);
      setMfaRequired(true);
      return;
    }

    finalizeLogin(data.data.accessToken, data.data.refreshToken);
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { status, data } = await apiCall('/auth/verify-mfa', {
      method: 'POST',
      body: { tempToken, otpCode }
    });
    setLoading(false);

    if (status !== 200) {
      setError(data.message || 'Invalid code');
      return;
    }

    finalizeLogin(data.data.accessToken, data.data.refreshToken);
  }

  return (
    <main className="max-w-sm mx-auto p-6 mt-16 animate-fade-in">
      <div className="card">
        <h1 className="text-xl font-semibold mb-1">Admin Login</h1>
        <p className="text-gray-400 text-xs mb-6">Restricted access — administrators only</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>}

        {!mfaRequired ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full border rounded px-3 py-2"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full border rounded px-3 py-2"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gray-900 text-white rounded disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyMfa} className="space-y-3">
            <p className="text-sm text-gray-600">Enter the 6-digit code from your authenticator app.</p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              className="w-full border rounded px-3 py-2 tracking-widest text-center"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gray-900 text-white rounded disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
