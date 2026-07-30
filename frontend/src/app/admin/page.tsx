'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

type UnverifiedDoctor = {
  id: string;
  specialty: string;
  verified: boolean;
  created_at: string;
  full_name: string | null;
};

type PageState = 'loading' | 'ready' | 'error';

export default function AdminPage() {
  const { token, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [doctors, setDoctors] = useState<UnverifiedDoctor[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
  router.push('/admin/login');
}
    if (!authLoading && token && role !== 'admin') {
      router.push('/doctors'); // sirf admin ke liye page hai
    }
  }, [authLoading, token, role, router]);

  const fetchUnverified = useCallback(async () => {
    if (!token) return;
    setPageState('loading');
    const result = await apiCall<{ data: UnverifiedDoctor[] }>('/doctors/unverified', { token });
    if (result.status === 200) {
      setDoctors(result.data.data || []);
      setPageState('ready');
    } else {
      setPageState('error');
    }
  }, [token]);

  useEffect(() => {
    if (token && role === 'admin') fetchUnverified();
  }, [token, role, fetchUnverified]);

  const handleVerify = async (doctorId: string) => {
    if (!token) return;
    setVerifyingId(doctorId);
    const result = await apiCall(`/doctors/${doctorId}/verify`, { method: 'PATCH', token });
    setVerifyingId(null);

    if (result.status === 200) {
      // Verify hone ke baad list se hata do — ab yeh "unverified" nahi raha
      setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
    } else {
      alert('Could not verify this doctor. Please try again.');
    }
  };

  if (authLoading || pageState === 'loading') {
    return <main className="max-w-3xl mx-auto p-6 text-gray-500">Loading...</main>;
  }

  if (pageState === 'error') {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-red-600 mb-4">Could not load unverified doctors.</p>
        <button onClick={fetchUnverified} className="text-blue-600 hover:underline">
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 animate-fade-in">
      <h1 className="text-2xl font-semibold mb-6">Unverified Doctors</h1>

      {doctors.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          No doctors pending verification. All caught up!
        </div>
      ) : (
        <div className="grid gap-4">
          {doctors.map((d) => (
            <div key={d.id} className="card flex justify-between items-center">
              <div>
                <div className="font-medium text-lg">{d.full_name || 'Dr. (name unavailable)'}</div>
                <div className="text-gray-500 text-sm">{d.specialty}</div>
                <div className="text-gray-400 text-xs mt-1">
                  Registered {new Date(d.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </div>
              </div>
              <button
                onClick={() => handleVerify(d.id)}
                disabled={verifyingId === d.id}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 shrink-0"
              >
                {verifyingId === d.id ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
