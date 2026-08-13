'use client';

import { useEffect, useRef, useState } from 'react';
import { apiCall } from '@/lib/api';
import { HealthReportResponse } from '@/types';

// Report background mein generate hoti hai (fire-and-forget backend design), isliye
// pehli baar reportAvailable:false aaye toh thodi der baad khud-ba-khud retry karo.
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 5;

export default function HealthReportPanel({ consultationId, token }: { consultationId: string; token: string }) {
  const [data, setData] = useState<HealthReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pollCountRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const fetchReport = async () => {
      // CHANGED — backend success() helper response ko { success, data: {...} } mein
      // wrap karta hai, isliye generic type aur unwrapping dono fix ki hai (pehle
      // seedha HealthReportResponse maan liya tha, jo galat tha — isi wajah se
      // reportAvailable hamesha undefined aata tha, chahe backend mein sahi report ho).
      const result = await apiCall<{ data: HealthReportResponse }>(`/consultations/${consultationId}/report`, { token });
      if (!mounted) return;

      if (result.status === 200) {
        const reportData = result.data.data;
        setData(reportData);
        setError(false);

        if (!reportData.reportAvailable && pollCountRef.current < MAX_POLLS) {
          pollCountRef.current += 1;
          timer = setTimeout(fetchReport, POLL_INTERVAL_MS);
          return; // loading true rehne do jab tak poll chal raha hai
        }
      } else {
        setError(true);
      }
      setLoading(false);
    };

    fetchReport();

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [consultationId, token]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="w-4 h-4 border-2 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
        Preparing your health report...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 italic">Could not load the health report. Please try again later.</p>;
  }

  if (!data || !data.reportAvailable || !data.report) {
    return (
      <p className="text-sm text-slate-500 italic">
        No health report is available for this consultation — this usually happens if no symptoms were shared during the chat.
      </p>
    );
  }

  const { report, clinics, generatedAt } = data;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        {generatedAt && (
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">
            Generated {new Date(generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}

        <ReportField label="Chief Complaint" value={report.chiefComplaint} />
        <ReportField label="Symptoms Summary" value={report.symptomsSummary} />
        <ReportField label="Duration" value={report.duration} />
        <ReportField label="Suggested Specialty" value={report.specialty} />
        <ReportField label="Recommended Action" value={report.recommendedAction} />
      </div>

      <div>
        <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-2 text-sm">
          <span>🏥</span> Nearby Doctors / Clinics
        </h5>
        {clinics && clinics.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {clinics.map((c, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm shadow-sm hover:border-sky-300 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 truncate">{c.name}</div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    {c.type ? `${c.type} · ` : ''}
                    {c.distanceKm} km away
                  </div>
                </div>
                <a
                  href={c.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 bg-sky-100 text-sky-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-sky-200 transition-colors"
                >
                  Directions →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">No nearby clinics found automatically.</p>
        )}
      </div>

      <p className="text-xs text-slate-400 italic">
        This report is generated from your chat for reference only and is not a medical diagnosis. Please consult a doctor for confirmation and treatment.
      </p>
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-medium text-slate-400 uppercase">{label}</div>
      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{value}</div>
    </div>
  );
}