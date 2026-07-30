'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

type ModerationCase = {
  id: string;
  consultation_id: string;
  message_content: string;
  reported_user_name: string | null;
  reported_user_email: string;
  subject_type: 'human' | 'ai_doctor';
  severity: string;
  confidence: string;
  classifier_reason: string | null;
  keyword_matched: string | null;
  created_at: string;
};

type PageState = 'loading' | 'ready' | 'error';

const SEVERITY_STYLES: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  severe: 'bg-red-100 text-red-700'
};

export default function ModerationPage() {
  const { token, role, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) router.push('/admin/login');
    if (!authLoading && token && role !== 'admin') router.push('/doctors');
  }, [authLoading, token, role, router]);

  const fetchPending = useCallback(async () => {
    if (!token) return;
    setPageState('loading');
    const result = await apiCall<{ data: ModerationCase[] }>('/moderation/pending', { token });
    if (result.status === 200) {
      setCases(result.data.data || []);
      setPageState('ready');
    } else {
      setPageState('error');
    }
  }, [token]);

  useEffect(() => {
    if (token && role === 'admin') fetchPending();
  }, [token, role, fetchPending]);

  const handleResolve = async (caseItem: ModerationCase, action: string) => {
    if (!token) return;
    setResolvingId(caseItem.id);
    const result = await apiCall(`/moderation/${caseItem.id}/resolve`, {
      method: 'POST',
      token,
      body: { action }
    });
    setResolvingId(null);

    if (result.status === 200) {
      setCases((prev) => prev.filter((c) => c.id !== caseItem.id));
    } else {
      alert('Could not resolve this case. Please try again.');
    }
  };

  if (authLoading || pageState === 'loading') {
    return (
      <main className="max-w-4xl mx-auto p-6 md:p-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading moderation queue...</p>
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
        <h2 className="text-xl font-bold text-slate-800 mb-2">Connection Error</h2>
        <p className="text-slate-500 mb-6">Could not load pending moderation cases. Please ensure you have admin rights.</p>
        <button onClick={fetchPending} className="btn-primary mx-auto bg-slate-800 hover:bg-slate-900">
          Retry Request
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6 md:p-10 animate-fade-in w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trust & Safety Panel</h1>
          <p className="text-slate-500 mt-2">Review and resolve AI-flagged moderation cases.</p>
        </div>
        <div className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </span>
          {cases.length} Pending Cases
        </div>
      </div>

      {cases.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl text-center py-20 shadow-sm">
          <div className="text-5xl mb-4">🛡️</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Queue is empty</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            All caught up! There are no pending cases requiring human review at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {cases.map((c) => (
            <div key={c.id} className="card border-l-4 border-l-slate-400 hover:border-l-sky-500 transition-colors p-0 overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${c.subject_type === 'ai_doctor' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                      {c.subject_type === 'ai_doctor' ? '🤖' : '👤'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{c.reported_user_name || c.reported_user_email}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-500 text-sm font-medium">
                          {c.subject_type === 'ai_doctor' ? 'AI Persona' : 'Patient Account'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 text-sm">
                          {new Date(c.created_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${SEVERITY_STYLES[c.severity] || 'bg-slate-100 text-slate-700'}`}>
                    {c.severity} — {(Number(c.confidence) * 100).toFixed(0)}% Conf.
                  </span>
                </div>

                {/* Violating Content */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 relative">
                  <div className="absolute top-0 right-6 -translate-y-1/2 bg-white px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Flagged Content
                  </div>
                  <p className="text-slate-800 text-base leading-relaxed italic border-l-2 border-slate-300 pl-4">
                    "{c.message_content}"
                  </p>
                </div>

                {/* Analysis Data */}
                <div className="flex flex-wrap gap-4 mb-6 text-sm">
                  <div className="bg-blue-50/50 border border-blue-100 px-4 py-2 rounded-lg flex-1 min-w-[200px]">
                    <span className="block text-xs font-semibold text-blue-400 uppercase mb-1">Classifier Reason</span>
                    <span className="font-medium text-slate-700">{c.classifier_reason || 'Manual review required'}</span>
                  </div>
                  {c.keyword_matched && (
                    <div className="bg-amber-50/50 border border-amber-100 px-4 py-2 rounded-lg shrink-0">
                      <span className="block text-xs font-semibold text-amber-500 uppercase mb-1">Triggered Keyword</span>
                      <span className="font-medium text-slate-700">{c.keyword_matched}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mr-2">Actions:</span>
                  
                  {c.subject_type === 'human' ? (
                    <>
                      <button
                        onClick={() => handleResolve(c, 'temp_ban')}
                        disabled={resolvingId === c.id}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        <span>⏳</span> Temp Ban (7d)
                      </button>
                      <button
                        onClick={() => handleResolve(c, 'permanent_ban')}
                        disabled={resolvingId === c.id}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        <span>🚫</span> Permanent Ban
                      </button>
                      <button
                        onClick={() => handleResolve(c, 'uplift')}
                        disabled={resolvingId === c.id}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        <span>✓</span> False Alarm (Uplift)
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleResolve(c, 'flagged_for_prompt_review')}
                      disabled={resolvingId === c.id}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      <span>🛠️</span> Flag for Prompt Review
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleResolve(c, 'dismissed')}
                    disabled={resolvingId === c.id}
                    className="ml-auto bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    Dismiss Case
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}