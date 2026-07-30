'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Link from "next/link"
import GoogleSignInButton from '@/components/GoogleSignInButton';

function decodeRole(token: string): string {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.role;
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // NEW — dono jagah se same redirect-decision reuse karta hai
  function finishLogin(token: string, refreshToken: string, profileComplete: boolean) {
    login(token, decodeRole(token), refreshToken);
    router.push(profileComplete ? '/doctors' : '/complete-profile');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { status, data } = await apiCall('/auth/login', { method: 'POST', body: { email, password } });
    setLoading(false);
    if (status !== 200) { setError(data.message || 'Login failed'); return; }
    if (data.data.mfaRequired) {
      setTempToken(data.data.tempToken);
      setMfaRequired(true);
      return;
    }
    finishLogin(data.data.accessToken, data.data.refreshToken, data.data.profileComplete);
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { status, data } = await apiCall('/auth/verify-mfa', { method: 'POST', body: { tempToken, otpCode } });
    setLoading(false);
    if (status !== 200) { setError(data.message || 'Invalid code'); return; }
    finishLogin(data.data.accessToken, data.data.refreshToken, data.data.profileComplete);
  }

  // NEW — Google button se aane wala idToken handle karta hai
  async function handleGoogleCredential(idToken: string) {
    setError('');
    setLoading(true);
    const { status, data } = await apiCall('/auth/google', { method: 'POST', body: { idToken } });
    setLoading(false);
    if (status !== 200) { setError(data.message || 'Google sign-in failed'); return; }
    if (data.data.mfaRequired) {
      setTempToken(data.data.tempToken);
      setMfaRequired(true);
      return;
    }
    finishLogin(data.data.accessToken, data.data.refreshToken, data.data.profileComplete);
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/40 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {mfaRequired ? 'Security Verification' : 'Welcome Back'}
          </h1>
          <p className="text-slate-500 text-sm">
            {mfaRequired 
              ? 'Please enter the verification code sent to your device.' 
              : 'Sign in to access your consultations and health records.'}
          </p>
        </div>

        {!mfaRequired ? (
          <>
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full" 
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</label>
                  <Link href="/forgot-password" className="text-sky-600 text-xs font-semibold hover:text-sky-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full" 
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2 shadow-sky-200 shadow-lg">
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Or continue with</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <div className="flex justify-center">
              <GoogleSignInButton onCredential={handleGoogleCredential} />
            </div>
          </>
        ) : (
          <form onSubmit={handleVerifyMfa} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">6-Digit Code</label>
              <input 
                type="text" 
                placeholder="123456" 
                required 
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="input-field w-full text-center tracking-[0.5em] font-mono text-lg" 
                maxLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        )}

        {!mfaRequired && (
          <p className="text-center text-sm text-slate-500 mt-8 pt-6 border-t border-slate-100">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-sky-600 hover:text-sky-700 font-bold transition-colors">
              Create an account
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}