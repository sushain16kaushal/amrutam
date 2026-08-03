'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Country, City } from 'country-state-city';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import RequireAuth from '@/components/RequireAuth';
import SearchableSelect from '@/components/SearchableSelect';

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

  const countryOptions = useMemo(
    () => (countries || []).map((c) => ({ value: c.isoCode, label: c.name })),
    [countries]
  );
 const cityOptions = useMemo(
  () => (cities || []).map((ct, idx) => ({
    value: ct.name,
    label: ct.name,
    id: `${ct.name}-${ct.stateCode}-${idx}` // unique React-key, backend ko sirf 'value' jaata hai
  })),
  [cities]
);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!countryCode || !city) {
      setError('Please select both country and city');
      return;
    }
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
        <SearchableSelect
          options={countryOptions}
          value={countryCode}
          onChange={(val) => { setCountryCode(val); setCity(''); }}
          placeholder="Search country..."
        />

        <SearchableSelect
          options={cityOptions}
          value={city}
          onChange={(val) => setCity(val)}
          placeholder={countryCode ? 'Search city...' : 'Select country first'}
          disabled={!countryCode}
        />

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