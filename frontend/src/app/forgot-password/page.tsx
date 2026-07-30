'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data } = await apiCall('/auth/forgot-password', { method: 'POST', body: { email } });
    setLoading(false);
    setMessage(data.data?.message || 'Check your email for a code.');
    setStep('reset');
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { status, data } = await apiCall('/auth/reset-password', {
      method: 'POST', body: { email, otp, newPassword }
    });
    setLoading(false);
    if (status !== 200) { setError(data.message || 'Reset failed'); return; }
    router.push('/login?reset=success');
  }

  return (
    <main className="max-w-md mx-auto p-6 animate-fade-in">
      <h1 className="text-2xl font-semibold mb-2 text-slate-800">Reset your password</h1>
      {step === 'request' ? (
        <form onSubmit={handleRequest} className="flex flex-col gap-4 mt-6">
          <p className="text-slate-500 text-sm">Enter your email — we&apos;ll send a one-time code.</p>
          <input type="email" placeholder="Email" required value={email}
            onChange={(e) => setEmail(e.target.value)} className="input-field" />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Sending...' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="flex flex-col gap-4 mt-6">
          <p className="text-sky-700 text-sm bg-sky-50 px-3 py-2 rounded-lg">{message}</p>
          <input type="text" placeholder="6-digit code" required value={otp}
            onChange={(e) => setOtp(e.target.value)} className="input-field" />
          <input type="password" placeholder="New password" required value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} className="input-field" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      )}
    </main>
  );
}