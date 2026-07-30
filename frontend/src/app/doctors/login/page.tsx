'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import GoogleSignInButton from '@/components/GoogleSignInButton';

function decodeRole(token: string): string {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.role;
}

export default function DoctorLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function finishLogin(token: string, refreshToken: string) {
  login(token, decodeRole(token), refreshToken);
  router.push('/doctor-dashboard');
}

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { status, data } = await apiCall('/auth/login', { method: 'POST', body: { email, password } });
    setLoading(false);
    if (status !== 200) { setError(data.message || 'Login failed'); return; }
    if (data.data.mfaRequired) { setTempToken(data.data.tempToken); setMfaRequired(true); return; }
    finishLogin(data.data.accessToken, data.data.refreshToken);
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { status, data } = await apiCall('/auth/verify-mfa', { method: 'POST', body: { tempToken, otpCode } });
    setLoading(false);
    if (status !== 200) { setError(data.message || 'Invalid code'); return; }
    finishLogin(data.data.accessToken, data.data.refreshToken);
  }

  async function handleGoogleCredential(idToken: string) {
    setError('');
    setLoading(true);
    const { status, data } = await apiCall('/auth/google', { method: 'POST', body: { idToken, role: 'doctor' } });
    setLoading(false);
    if (status !== 200) { setError(data.message || 'Google sign-in failed'); return; }
    if (data.data.mfaRequired) { setTempToken(data.data.tempToken); setMfaRequired(true); return; }
    finishLogin(data.data.accessToken, data.data.refreshToken);
  }

  return (
    <main className="max-w-md mx-auto p-6 animate-fade-in">
      <h1 className="text-2xl font-semibold mb-6">{mfaRequired ? 'Enter verification code' : 'Doctor Login'}</h1>
      {!mfaRequired ? (
        <>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input type="email" placeholder="Email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="input-field" />
            <input type="password" placeholder="Password" required value={password}
              onChange={(e) => setPassword(e.target.value)} className="input-field" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div className="flex items-center gap-3 my-6">
            <div className="h-px bg-gray-200 flex-1" /><span className="text-gray-400 text-sm">OR</span><div className="h-px bg-gray-200 flex-1" />
          </div>
          <GoogleSignInButton onCredential={handleGoogleCredential} />
        </>
      ) : (
        <form onSubmit={handleVerifyMfa} className="flex flex-col gap-4">
          <p className="text-gray-500 text-sm">Enter the 6-digit code from your authenticator app.</p>
          <input type="text" placeholder="123456" required value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)} className="input-field" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className='btn-primary' type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
        </form>
      )}
      {!mfaRequired && (
        <p className="text-center text-sm text-slate-500 mt-8 pt-6 border-t border-slate-100">
          Don&apos;t have a doctor account?{' '}
          <Link href="/doctors/register" className="text-sky-600 hover:text-sky-700 font-bold transition-colors">Register here</Link>
        </p>
      )}
    </main>
  );
}