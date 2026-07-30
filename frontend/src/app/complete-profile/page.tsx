'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Country, City } from 'country-state-city';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import RequireAuth from '@/components/RequireAuth';

function CompleteProfileForm() {
  const router = useRouter();
  const { token } = useAuth();
  const [countryCode, setCountryCode] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const cities = useMemo(
    () => (countryCode ? City.getCitiesOfCountry(countryCode) : []),
    [countryCode]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { status, data } = await apiCall('/users/me', {
      method: 'PATCH',
      token: token || undefined,
      body: { country: countryCode, city }
    });
    setLoading(false);
    if (status !== 200) { setError(data.message || 'Could not save your details'); return; }
    router.push('/doctors');
  }

  return (
    <main className="max-w-md mx-auto p-6 animate-fade-in">
      <h1 className="text-2xl font-semibold mb-2">Just one more thing</h1>
      <p className="text-gray-500 text-sm mb-6">
        Tell us your location so we can connect you with doctors and services near you.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <select required value={countryCode}
          onChange={(e) => { setCountryCode(e.target.value); setCity(''); }}
          className="input-field">
          <option value="">Select country</option>
          {countries?.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
          ))}
        </select>

        <select required value={city} disabled={!countryCode}
          onChange={(e) => setCity(e.target.value)}
          className="input-field">
          <option value="">Select city</option>
         {cities?.map((ct, idx) => (
  <option key={`${ct.name}-${ct.stateCode}-${idx}`} value={ct.name}>{ct.name}</option>
))}
        </select>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </main>
  );
}

export default function CompleteProfilePage() {
  return (
    <RequireAuth>
      <CompleteProfileForm />
    </RequireAuth>
  );
}