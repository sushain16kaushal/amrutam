import { apiCall } from '@/lib/api';
import { Doctor } from '@/types';
import Link from 'next/link';
import DoctorSearchForm from '@/components/DoctorSearchForm';

type SearchParams = Promise<{ specialty?: string; name?: string; doctorKind?: string }>;

export default async function DoctorsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const doctorKind = params.doctorKind === 'human' ? 'human' : 'ai'; // default-tab = AI

  const query = new URLSearchParams();
  if (params.specialty) query.set('specialty', params.specialty);
  if (params.name) query.set('name', params.name);
  query.set('doctorKind', doctorKind);

  const [{ data }, { data: specialtiesData }] = await Promise.all([
    apiCall<{ data: { results: Doctor[] } }>(`/doctors/search?${query.toString()}`),
    apiCall<{ data: string[] }>('/doctors/specialties')
  ]);
  const doctors = data.data?.results || [];
  const specialties = specialtiesData.data || [];

  const tabHref = (kind: string) => {
    const p = new URLSearchParams();
    if (params.specialty) p.set('specialty', params.specialty);
    if (params.name) p.set('name', params.name);
    p.set('doctorKind', kind);
    return `/doctors?${p.toString()}`;
  };

  return (
    <main className="max-w-5xl mx-auto p-6 md:p-10 animate-fade-in w-full">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Find a <span className="gradient-text">Doctor</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Search for specialized medical professionals or consult with our advanced AI doctors instantly.
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <Link
          href={tabHref('ai')}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm
            ${doctorKind === 'ai' ? 'bg-sky-600 text-white shadow-sky-200' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
        >
          AI Doctors
        </Link>
        <Link
          href={tabHref('human')}
          className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm
            ${doctorKind === 'human' ? 'bg-sky-600 text-white shadow-sky-200' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
        >
          Human Doctors
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-10">
        <DoctorSearchForm specialties={specialties} doctorKind={doctorKind} />
      </div>

      {doctors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-slate-500 text-lg font-medium">No doctors found for your criteria.</p>
          <p className="text-slate-400 mt-1">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <Link key={doc.id} href={`/doctors/${doc.id}`} className="card block group">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-xl text-slate-900 group-hover:text-sky-600 transition-colors">
                    {doc.full_name || 'Dr. (name pending)'}
                  </div>
                  <div className="text-sky-600 font-medium text-sm mt-1 bg-sky-50 inline-block px-2 py-0.5 rounded-md border border-sky-100">
                    {doc.specialty}
                  </div>
                </div>
                {doc.verified && (
                  <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 rounded-full" title="Verified">
                    ✓
                  </span>
                )}
              </div>
              
              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">View Profile</span>
                <span className="text-sky-600 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}