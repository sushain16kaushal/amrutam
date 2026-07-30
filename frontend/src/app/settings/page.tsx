'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiCall } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';

function SettingsContent() {
  const { token } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [isOAuthAccount, setIsOAuthAccount] = useState(false); // NEW
  const [qrCode, setQrCode] = useState('');
  const [enabling, setEnabling] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Password-based disable-flow (local accounts)
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [password, setPassword] = useState('');
  const [disabling, setDisabling] = useState(false);

  // NEW — OTP-based disable-flow (OAuth accounts)
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      const { data } = await apiCall('/users/me', { token: token! });
      setMfaEnabled(!!data.data?.mfa_enabled);
      setIsOAuthAccount(data.data?.auth_provider === 'google'); // NEW
    }
    if (token) checkStatus();
  }, [token]);

  async function handleEnableMfa() {
    setEnabling(true);
    setError('');
    const { status, data } = await apiCall('/auth/enable-mfa', { method: 'POST', token: token! });
    setEnabling(false);
    if (status !== 200) { setError(data.message || 'Failed to enable MFA'); return; }
    setQrCode(data.data.qrCodeDataUrl);
  }

  async function handleDisableMfa(e: React.FormEvent) {
    e.preventDefault();
    setDisabling(true);
    setError('');
    const { status, data } = await apiCall('/auth/disable-mfa', {
      method: 'POST', token: token!, body: { password }
    });
    setDisabling(false);
    if (status !== 200) { setError(data.message || 'Failed to disable MFA'); return; }
    setMfaEnabled(false);
    setShowDisableForm(false);
    setPassword('');
  }

  // NEW — OTP request
  async function handleRequestOtp() {
    setSendingOtp(true);
    setError('');
    const { status, data } = await apiCall('/auth/disable-mfa/request-otp', { method: 'POST', token: token! });
    setSendingOtp(false);
    if (status !== 200) { setError(data.message || 'Failed to send code'); return; }
    setOtpSent(true);
  }

  // NEW — OTP verify
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setVerifyingOtp(true);
    setError('');
    const { status, data } = await apiCall('/auth/disable-mfa/verify-otp', {
      method: 'POST', token: token!, body: { otp: otpCode }
    });
    setVerifyingOtp(false);
    if (status !== 200) { setError(data.message || 'Invalid code'); return; }
    setMfaEnabled(false);
    setOtpSent(false);
    setOtpCode('');
  }

  if (mfaEnabled === null) return <main className="p-6 text-slate-500">Loading...</main>;

  return (
    <main className="max-w-md mx-auto p-6 animate-fade-in">
      <h1 className="text-2xl font-semibold mb-6 text-slate-800">Account Settings</h1>

      <div className="card">
        <h2 className="font-medium text-slate-700 mb-2">Two-Factor Authentication</h2>

        {/* Enabled, koi disable-form khula nahi — dono account-type ke liye same entry-point */}
        {mfaEnabled && !showDisableForm && !otpSent && (
          <>
            <p className="text-sky-700 bg-sky-50 px-4 py-3 rounded-lg text-sm mb-4">
              2FA is currently enabled on your account.
            </p>
            {isOAuthAccount ? (
              <button onClick={handleRequestOtp} disabled={sendingOtp} className="text-red-600 text-sm hover:underline disabled:opacity-50">
                {sendingOtp ? 'Sending code...' : 'Disable 2FA'}
              </button>
            ) : (
              <button onClick={() => setShowDisableForm(true)} className="text-red-600 text-sm hover:underline">
                Disable 2FA
              </button>
            )}
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </>
        )}

        {/* Local-account: password-confirm */}
        {mfaEnabled && showDisableForm && (
          <form onSubmit={handleDisableMfa} className="flex flex-col gap-3">
            <p className="text-slate-500 text-sm">Confirm your password to disable 2FA:</p>
            <input type="password" placeholder="Current password" required value={password}
              onChange={(e) => setPassword(e.target.value)} className="input-field" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={disabling}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {disabling ? 'Disabling...' : 'Confirm Disable'}
              </button>
              <button type="button" onClick={() => { setShowDisableForm(false); setError(''); }}
                className="text-slate-500 text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* NEW — OAuth-account: email-OTP-confirm */}
        {mfaEnabled && otpSent && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
            <p className="text-slate-500 text-sm">Enter the 6-digit code sent to your email to disable 2FA:</p>
            <input type="text" placeholder="123456" required value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)} className="input-field" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={verifyingOtp}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {verifyingOtp ? 'Verifying...' : 'Confirm Disable'}
              </button>
              <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); }}
                className="text-slate-500 text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {!mfaEnabled && !qrCode && !done && (
          <>
            <p className="text-slate-500 text-sm mb-4">
              Add an extra layer of security using an authenticator app.
            </p>
            <button onClick={handleEnableMfa} disabled={enabling} className="btn-primary">
              {enabling ? 'Setting up...' : 'Enable 2FA'}
            </button>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </>
        )}

        {qrCode && !done && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-slate-500 text-sm">Scan this QR code with your authenticator app:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="MFA QR Code" className="border border-slate-200 rounded-lg" />
            <button onClick={() => { setDone(true); setMfaEnabled(true); }} className="btn-primary">
              I&apos;ve scanned it
            </button>
          </div>
        )}

        {done && (
          <p className="text-sky-700 bg-sky-50 px-4 py-3 rounded-lg text-sm">
            2FA is now enabled. You&apos;ll be asked for a code on your next login.
          </p>
        )}
      </div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}