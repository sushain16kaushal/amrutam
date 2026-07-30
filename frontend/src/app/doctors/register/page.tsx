'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { Country, City } from 'country-state-city';
import Link from 'next/link';

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', fullName: '', country: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const cities = useMemo(() => (form.country ? City.getCitiesOfCountry(form.country) : []), [form.country]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { status, data } = await apiCall('/auth/register', {
      method: 'POST',
      body: { ...form, role: 'doctor' }
    });
    setLoading(false);
    if (status !== 201) { setError(data.message || 'Registration failed'); return; }
    router.push('/doctor/login?registered=true');
  }

  return (
    <main className="max-w-md mx-auto p-6 animate-fade-in">
      <h1 className="text-2xl font-semibold mb-6">Doctor Registration</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="email" placeholder="Email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
        <input type="password" placeholder="Password (min 8, 1 uppercase, 1 number)" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" />
        <input type="text" placeholder="Full name" value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input-field" />

        <select required value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value, city: '' })} className="input-field">
          <option value="">Select country</option>
          {countries?.map((c) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
        </select>

        <select required value={form.city} disabled={!form.country}
          onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field">
          <option value="">Select city</option>
          {cities?.map((ct, idx) => (
            <option key={`${ct.name}-${ct.stateCode}-${idx}`} value={ct.name}>{ct.name}</option>
          ))}
        </select>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating account...' : 'Register as Doctor'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        Already have a doctor account?{' '}
        <Link href="/doctor/login" className="text-sky-600 hover:underline font-medium">Login here</Link>
      </p>
      <p className="text-center text-sm text-slate-500 mt-2">
        Are you a patient?{' '}
        <Link href="/register" className="text-sky-600 hover:underline font-medium">Register here</Link>
      </p>
    </main>
  );
}