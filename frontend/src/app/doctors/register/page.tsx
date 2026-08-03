'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { Country, City } from 'country-state-city';
import Link from 'next/link';
import SearchableSelect from '@/components/SearchableSelect';

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', fullName: '', country: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const cities = useMemo(() => (form.country ? City.getCitiesOfCountry(form.country) : []), [form.country]);

  const countryOptions = useMemo(
    () => (countries || []).map((c) => ({ value: c.isoCode, label: c.name })),
    [countries]
  );
  const cityOptions = useMemo(
    () => (cities || []).map((ct, idx) => ({ value: ct.name, label: ct.name, key: `${ct.name}-${ct.stateCode}-${idx}` })),
    [cities]
  );

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

        <SearchableSelect
          options={countryOptions}
          value={form.country}
          onChange={(val) => setForm({ ...form, country: val, city: '' })}
          placeholder="Search country..."
        />

        <SearchableSelect
          options={cityOptions}
          value={form.city}
          onChange={(val) => setForm({ ...form, city: val })}
          placeholder={form.country ? 'Search city...' : 'Select country first'}
          disabled={!form.country}
        />

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