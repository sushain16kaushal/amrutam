'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function DoctorSearchForm({ specialties,doctorKind }: { specialties: string[]; doctorKind: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '');
  const [name, setName] = useState(searchParams.get('name') || '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // browser ka default navigation ROKO
    const params = new URLSearchParams();
    if (specialty) params.set('specialty', specialty);
    if (name) params.set('name', name);
    params.set('doctorKind', doctorKind);
    router.push(`/doctors?${params.toString()}`); // client-side navigation — SPA jaisa
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="flex-1 relative">
        <select
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="input-field w-full appearance-none pl-10"
        >
          <option value="">All Specialties</option>
          {specialties.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          🩺
        </span>
      </div>
      
      <div className="flex-1 relative">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Search by doctor name..."
          className="input-field w-full pl-10"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          🔍
        </span>
      </div>
      
      <button type="submit" className="btn-primary md:w-auto w-full">
        Search Doctors
      </button>
    </form>
  );
}