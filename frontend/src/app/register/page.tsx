'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { Country, City } from 'country-state-city';
import Link from 'next/link';
import SearchableSelect from '@/components/SearchableSelect';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', role: 'patient', fullName: '', country: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const countries = useMemo(() => Country.getAllCountries(), []);
  const cities = useMemo(
    () => (form.country ? City.getCitiesOfCountry(form.country) : []),
    [form.country]
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
    setLoading(true);
    const { status, data } = await apiCall('/auth/register', { method: 'POST', body: form });
    setLoading(false);
    if (status !== 201) {
      setError(data.message || 'Registration failed');
      return;
    }
    router.push('/login?registered=true');
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/40 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Create Account</h1>
          <p className="text-slate-500 text-sm">Join us to start managing your health journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe" 
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="input-field w-full" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              required 
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field w-full" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
            <input 
              type="password" 
              placeholder="Min 8 chars, 1 uppercase, 1 number" 
              required 
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field w-full" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Country</label>
              <SearchableSelect
                options={countryOptions}
                value={form.country}
                onChange={(val) => setForm({ ...form, country: val, city: '' })}
                placeholder="Search country..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">City</label>
              <SearchableSelect
                options={cityOptions}
                value={form.city}
                onChange={(val) => setForm({ ...form, city: val })}
                placeholder={form.country ? 'Search city...' : 'Select country first'}
                disabled={!form.country}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2 mt-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4 shadow-sky-200 shadow-lg">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-8 pt-6 border-t border-slate-100">
          Already have an account?{' '}
          <Link href="/login" className="text-sky-600 hover:text-sky-700 font-bold transition-colors">
            Log in here
          </Link>
        </p>
      </div>
    </main>
  );
}