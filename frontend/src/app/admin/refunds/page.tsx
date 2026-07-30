'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { RefundRequest } from '@/types';

type PageState = 'loading' | 'ready' | 'error';

export default function AdminRefundsPage() {
  const { token, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDrafts, setRejectDrafts] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/admin/login');
      return;
    }
    if (!authLoading && token && role !== 'admin') {
      router.push('/doctors');
    }
  }, [authLoading, token, role, router]);

  const fetchPending = useCallback(async () => {
    if (!token) return;
    setPageState('loading');
    const result = await apiCall<{ data: RefundRequest[] }>('/refunds/pending', { token });
    if (result.status === 200) {
      setRequests(result.data.data || []);
      setPageState('ready');
    } else {
      setPageState('error');
    }
  }, [token]);

  useEffect(() => {
    if (token && role === 'admin') fetchPending();
  }, [token, role, fetchPending]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    const confirmed = window.confirm('Approve this refund request?');
    if (!confirmed) return;

    setProcessingId(id);
    const result = await apiCall(`/refunds/${id}/approve`, { method: 'PATCH', token });
    setProcessingId(null);

    if (result.status === 200) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert((result.data as { message?: string })?.message || 'Could not approve this request.');
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    const adminMessage = rejectDrafts[id]?.trim();
    if (!adminMessage) {
      alert('Please write a reason for rejecting this request.');
      return;
    }

    setProcessingId(id);
    const result = await apiCall(`/refunds/${id}/reject`, {
      method: 'PATCH',
      body: { adminMessage },
      token
    });
    setProcessingId(null);

    if (result.status === 200) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert((result.data as { message?: string })?.message || 'Could not reject this request.');
    }
  };

  if (authLoading || pageState === 'loading') {
    return <main className="max-w-3xl mx-auto p-6 text-gray-500">Loading...</main>;
  }

  if (pageState === 'error') {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <p className="text-red-600 mb-4">Could not load refund requests.</p>
        <button onClick={fetchPending} className="text-blue-600 hover:underline">
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 animate-fade-in">
      <h1 className="text-2xl font-semibold mb-6">Pending Refund Requests</h1>

      {requests.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          No pending refund requests. All caught up!
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((r) => (
            <div key={r.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium">{r.patient_name || 'Patient'}</div>
                  <div className="text-gray-400 text-xs">{r.patient_email}</div>
                </div>
                <div className="text-gray-400 text-xs">
                  {new Date(r.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </div>
              </div>

              <div className="bg-gray-50 rounded p-3 text-sm text-gray-800 mb-3">
                {r.reason}
              </div>

              <div className="flex gap-3 items-start flex-wrap">
                <button
                  onClick={() => handleApprove(r.id)}
                  disabled={processingId === r.id}
                  className="text-sm px-3 py-1.5 bg-green-600 text-white rounded disabled:opacity-50"
                >
                  {processingId === r.id ? 'Processing...' : 'Approve'}
                </button>

                {rejectingId === r.id ? (
                  <div className="flex-1 min-w-50 flex gap-2">
                    <input
                      type="text"
                      value={rejectDrafts[r.id] || ''}
                      onChange={(e) => setRejectDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Reason for rejection..."
                      className="flex-1 border rounded px-3 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => handleReject(r.id)}
                      disabled={processingId === r.id}
                      className="text-sm px-3 py-1.5 bg-red-600 text-white rounded disabled:opacity-50"
                    >
                      Confirm Reject
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRejectingId(r.id)}
                    className="text-sm px-3 py-1.5 border border-red-600 text-red-600 rounded"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
