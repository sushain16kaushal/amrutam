'use client';
import StarRating from '@/components/StarRating';
import { Review, RefundRequest } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { MyConsultation, Prescription } from '@/types';
import ConsultationChat from '@/components/ConsultationChat';

type PageState = 'loading' | 'ready' | 'error';

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500'
};

const CANCELLABLE_STATUSES = ['pending', 'confirmed'];
const CHATTABLE_STATUSES = ['confirmed', 'in_progress', 'completed']; // completed add kiya — read-only view allowed

export default function ConsultationsPage() {
  const [now, setNow] = useState(() => new Date());
useEffect(() => {
  const id = setInterval(() => setNow(new Date()), 30 * 1000);
  return () => clearInterval(id);
}, []);
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [consultations, setConsultations] = useState<MyConsultation[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingPrescriptionId, setLoadingPrescriptionId] = useState<string | null>(null);

  const [chatOpenId, setChatOpenId] = useState<string | null>(null); // NEW — kis consultation ka chat khula hai
  const [reviewOpenId, setReviewOpenId] = useState<string | null>(null);
const [reviewDraft, setReviewDraft] = useState({ rating: 0, text: '' });
const [submittingReview, setSubmittingReview] = useState(false);
const [submittedReviews, setSubmittedReviews] = useState<Set<string>>(new Set());

const [refundOpenId, setRefundOpenId] = useState<string | null>(null);
const [refundReason, setRefundReason] = useState('');
const [submittingRefund, setSubmittingRefund] = useState(false);
const [refundStatuses, setRefundStatuses] = useState<Record<string, RefundRequest>>({});

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login?next=/consultations');
    }
  }, [authLoading, token, router]);

  const fetchConsultations = useCallback(async () => {
    if (!token) return;
    setPageState('loading');
    const result = await apiCall<{ data: MyConsultation[] }>('/consultations/mine', { token });
    if (result.status === 200) {
      setConsultations(result.data.data || []);
      setPageState('ready');
    } else {
      setPageState('error');
    }
  }, [token]);
  const fetchMyRefunds = useCallback(async () => {
  if (!token) return;
  const result = await apiCall<{ data: RefundRequest[] }>('/refunds/mine', { token });
  if (result.status === 200) {
    const map: Record<string, RefundRequest> = {};
    (result.data.data || []).forEach((r) => { map[r.consultation_id] = r; });
    setRefundStatuses(map);
  }
}, [token]);

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchConsultations();
      fetchMyRefunds(); 
    }
  }, [token, fetchConsultations,fetchMyRefunds]);

  const handleCancel = async (id: string) => {
    if (!token) return;
    const confirmed = window.confirm('Are you sure you want to cancel this consultation?');
    if (!confirmed) return;

    setCancellingId(id);
    const result = await apiCall(`/consultations/${id}/cancel`, { method: 'POST', token });
    setCancellingId(null);

    if (result.status === 200) {
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'cancelled' } : c))
      );
    } else {
      alert('Could not cancel this consultation. Please try again.');
    }
  };

  const handleTogglePrescription = async (id: string) => {
    if (!token) return;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (prescriptions[id]) return;

    setLoadingPrescriptionId(id);
    const result = await apiCall<{ data: Prescription[] }>(`/consultations/${id}/prescriptions`, { token });
    setLoadingPrescriptionId(null);

    if (result.status === 200) {
      setPrescriptions((prev) => ({ ...prev, [id]: result.data.data || [] }));
    } else {
      setPrescriptions((prev) => ({ ...prev, [id]: [] }));
    }
  };

  const handleSubmitReview = async (consultationId: string) => {
  if (!token || reviewDraft.rating === 0) return;
  setSubmittingReview(true);
  const result = await apiCall<{ data: Review }>(`/consultations/${consultationId}/reviews`, {
    method: 'POST',
    body: { rating: reviewDraft.rating, reviewText: reviewDraft.text.trim() || undefined },
    token
  });
  setSubmittingReview(false);

  if (result.status === 201) {
    setSubmittedReviews((prev) => new Set(prev).add(consultationId));
    setReviewOpenId(null);
    setReviewDraft({ rating: 0, text: '' });
  } else {
    alert((result.data as { message?: string })?.message || 'Could not submit review.');
  }
};

const handleSubmitRefund = async (consultationId: string) => {
  if (!token || refundReason.trim().length < 10) {
    alert('Please write at least 10 characters explaining the issue.');
    return;
  }
  setSubmittingRefund(true);
  const result = await apiCall<{ data: RefundRequest }>(`/consultations/${consultationId}/refunds`, {
    method: 'POST',
    body: { reason: refundReason.trim() },
    token
  });
  setSubmittingRefund(false);

  if (result.status === 201) {
    setRefundStatuses((prev) => ({ ...prev, [consultationId]: result.data.data }));
    setRefundOpenId(null);
    setRefundReason('');
  } else {
    alert((result.data as { message?: string })?.message || 'Could not submit refund request.');
  }
};

  if (authLoading || pageState === 'loading') {
    return (
      <main className="max-w-4xl mx-auto p-6 md:p-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading your consultations...</p>
        </div>
      </main>
    );
  }

  if (pageState === 'error') {
    return (
      <main className="max-w-4xl mx-auto p-6 md:p-10 text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-4 text-2xl">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
        <p className="text-slate-500 mb-6">Could not load your consultations. Please check your connection and try again.</p>
        <button onClick={fetchConsultations} className="btn-primary mx-auto">
          Retry Loading
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 md:p-10 animate-fade-in w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Consultations</h1>
        <p className="text-slate-500 mt-1">Manage your appointments, prescriptions, and chats.</p>
      </div>

      {consultations.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No consultations found</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            You haven&apos;t booked any appointments yet. Find a specialized doctor or consult with an AI to get started.
          </p>
          <button onClick={() => router.push('/doctors')} className="btn-primary mx-auto">
            Find a Doctor
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {consultations.map((c) => {
            const start = new Date(c.start_time);
            const end = new Date(c.end_time);
            const canCancel = CANCELLABLE_STATUSES.includes(c.status);
            const isCompleted = c.status === 'completed';
            const isExpanded = expandedId === c.id;
            const slotStart = new Date(c.start_time);
            const canChat = CHATTABLE_STATUSES.includes(c.status); // NEW
            const chatNotYetOpen = c.status !== 'completed' && now < slotStart;
            
            return (
              <div key={c.id} className="card overflow-hidden">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-lg shrink-0">
                      {c.doctor_name ? c.doctor_name.charAt(0).toUpperCase() : 'D'}
                    </div>
                    <div>
                      <div className="font-bold text-lg text-slate-900">
                        {c.doctor_name || 'Dr. (name unavailable)'}
                      </div>
                      <div className="text-sky-600 font-medium text-sm">{c.specialty}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_STYLES[c.status] || 'bg-slate-100 text-slate-600'}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="bg-slate-50 rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <span className="text-lg">📅</span>
                    <div>
                      <div className="text-xs font-medium text-slate-400 uppercase">Date</div>
                      <div className="font-medium text-slate-800">
                        {start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <span className="text-lg">⏰</span>
                    <div>
                      <div className="text-xs font-medium text-slate-400 uppercase">Time</div>
                      <div className="font-medium text-slate-800">
                        {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {canChat && (
                    chatNotYetOpen ? (
                      <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 flex items-center gap-2">
                        <span>⏳</span> Opens at {slotStart.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <button
                        onClick={() => setChatOpenId(chatOpenId === c.id ? null : c.id)}
                        className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                          chatOpenId === c.id 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                        }`}
                      >
                        {chatOpenId === c.id ? 'Close Chat' : isCompleted ? 'View Chat History' : 'Open Consultation Room'}
                      </button>
                    )
                  )}

                  {isCompleted && (
                    <button
                      onClick={() => handleTogglePrescription(c.id)}
                      className="text-sm font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-sky-100"
                    >
                      {isExpanded ? 'Hide Prescription' : 'View Prescription'}
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(c.id)}
                      disabled={cancellingId === c.id}
                      className="text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors ml-auto disabled:opacity-50"
                    >
                      {cancellingId === c.id ? 'Cancelling...' : 'Cancel Appointment'}
                    </button>
                  )}
                </div>

                {/* Expandable Sections */}
                {isExpanded && (
                  <div className="mt-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100 animate-fade-in">
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <span>📄</span> Medical Prescription
                    </h4>
                    {loadingPrescriptionId === c.id ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-4 h-4 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
                        Loading details...
                      </div>
                    ) : prescriptions[c.id]?.length ? (
                      <div className="space-y-4">
                        {prescriptions[c.id].map((p) => (
                          <div key={p.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">
                              Issued {new Date(p.issued_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })}
                            </div>
                            <div className="whitespace-pre-wrap text-slate-700 font-medium leading-relaxed">{p.details}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No prescription has been issued yet for this consultation.</p>
                    )}
                  </div>
                )}

                {/* Chat Widget Container */}
                {chatOpenId === c.id && token && (
                  <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-fade-in">
                    <div className="bg-slate-800 text-white px-4 py-2 text-sm font-medium flex justify-between items-center">
                      <span>Consultation Room</span>
                      <button onClick={() => setChatOpenId(null)} className="text-slate-300 hover:text-white">✕</button>
                    </div>
                    <ConsultationChat consultationId={c.id} token={token} status={c.status} endTime={c.end_time} />
                  </div>
                )}

                {/* Reviews and Refunds (Completed Only) */}
                {isCompleted && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-start">
                    
                    {/* Review Section */}
                    {!submittedReviews.has(c.id) && (
                      <div className="flex-1 min-w-[250px]">
                        {reviewOpenId === c.id ? (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in">
                            <p className="text-sm font-semibold text-slate-800 mb-2">Rate your consultation</p>
                            <StarRating
                              value={reviewDraft.rating}
                              onChange={(rating) => setReviewDraft((prev) => ({ ...prev, rating }))}
                            />
                            <textarea
                              value={reviewDraft.text}
                              onChange={(e) => setReviewDraft((prev) => ({ ...prev, text: e.target.value }))}
                              placeholder="Share your experience (optional)..."
                              rows={2}
                              className="input-field mt-3 text-sm py-2"
                            />
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleSubmitReview(c.id)}
                                disabled={submittingReview || reviewDraft.rating === 0}
                                className="btn-primary py-1.5 px-4 text-sm"
                              >
                                {submittingReview ? 'Submitting...' : 'Submit'}
                              </button>
                              <button onClick={() => setReviewOpenId(null)} className="btn-secondary py-1.5 px-4 text-sm">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setReviewOpenId(c.id)} className="text-sm font-medium text-slate-500 hover:text-sky-600 flex items-center gap-1 transition-colors">
                            <span>⭐</span> Leave a Review
                          </button>
                        )}
                      </div>
                    )}

                    {/* Refund Section */}
                    <div className="flex-1 min-w-[250px] flex justify-end">
                      {refundStatuses[c.id] ? (
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            refundStatuses[c.id].status === 'approved' ? 'bg-green-100 text-green-700' :
                            refundStatuses[c.id].status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            Refund {refundStatuses[c.id].status}
                          </span>
                          {refundStatuses[c.id].admin_message && (
                            <p className="text-slate-500 text-xs mt-1.5 bg-slate-50 p-2 rounded-md border border-slate-100">
                              Admin note: {refundStatuses[c.id].admin_message}
                            </p>
                          )}
                        </div>
                      ) : refundOpenId === c.id ? (
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 w-full animate-fade-in">
                          <p className="text-sm font-semibold text-red-800 mb-2">Request a Refund</p>
                          <textarea
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="Explain what went wrong (min 10 chars)..."
                            rows={2}
                            className="input-field mt-1 text-sm py-2 border-red-200 focus:ring-red-400 focus:border-red-400 bg-white"
                          />
                          <div className="flex gap-2 mt-3 justify-end">
                            <button onClick={() => setRefundOpenId(null)} className="text-slate-500 hover:bg-slate-200/50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubmitRefund(c.id)}
                              disabled={submittingRefund || refundReason.trim().length < 10}
                              className="bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 px-4 rounded-lg text-sm disabled:opacity-50 transition-colors"
                            >
                              {submittingRefund ? 'Submitting...' : 'Submit Request'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setRefundOpenId(c.id)} className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors">
                          Request Refund
                        </button>
                      )}
                    </div>
                    
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
