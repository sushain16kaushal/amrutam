'use client';
import { Country, City } from 'country-state-city';
import { useEffect, useState, useCallback ,useMemo} from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { AssignedConsultation, DoctorProfile, Prescription } from '@/types';
import ConsultationChat from '@/components/ConsultationChat';

type PageState = 'loading' | 'ready' | 'error';

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500'
};

const CHATTABLE_STATUSES = ['confirmed', 'in_progress']; // NEW

export default function DoctorDashboardPage() {
  const { token, role, loading: authLoading } = useAuth();
  const router = useRouter();
const [slotCapacity, setSlotCapacity] = useState('3');
  const [pageState, setPageState] = useState<PageState>('loading');
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const [consultations, setConsultations] = useState<AssignedConsultation[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [slotMessage, setSlotMessage] = useState('');
  const [addingSlot, setAddingSlot] = useState(false);

  const [prescriptionDrafts, setPrescriptionDrafts] = useState<Record<string, string>>({});
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingPrescriptionId, setSavingPrescriptionId] = useState<string | null>(null);

  const [chatOpenId, setChatOpenId] = useState<string | null>(null); // NEW
  const [userProfile, setUserProfile] = useState<{ country?: string; city?: string } | null>(null);
const [countryCode, setCountryCode] = useState('');
const [city, setCity] = useState('');
const [savingLocation, setSavingLocation] = useState(false);
const [locationError, setLocationError] = useState('');

const countries = useMemo(() => Country.getAllCountries(), []);
const citiesForCountry = useMemo(
  () => (countryCode ? City.getCitiesOfCountry(countryCode) : []),
  [countryCode]
);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login?next=/doctor-dashboard');
      return;
    }
    if (!authLoading && token && role !== 'doctor') {
      router.push('/doctors');
    }
  }, [authLoading, token, role, router]);

  const fetchAll = useCallback(async () => {
  if (!token) return;
  setPageState('loading');

  const [profileResult, consultationsResult, userProfileResult] = await Promise.all([
    apiCall<{ data: DoctorProfile | null }>('/doctors/me', { token }),
    apiCall<{ data: AssignedConsultation[] }>('/consultations/assigned', { token }),
    apiCall<{ data: { country?: string; city?: string } }>('/users/me', { token })
  ]);

  if (profileResult.status === 200) setProfile(profileResult.data.data);
  if (consultationsResult.status === 200) setConsultations(consultationsResult.data.data || []);
  if (userProfileResult.status === 200) setUserProfile(userProfileResult.data.data);
  setPageState('ready');
}, [token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (token && role === 'doctor') fetchAll();
  }, [token, role, fetchAll]);

  const handleRegisterAsDoctor = async () => {
    if (!token || !specialtyInput.trim()) return;
    setRegistering(true);
    setRegisterError('');

    const result = await apiCall<{ data: DoctorProfile }>('/doctors/register', {
      method: 'POST',
      body: { specialty: specialtyInput.trim() },
      token
    });
    setRegistering(false);

    if (result.status === 201) {
      setProfile(result.data.data);
    } else {
      setRegisterError((result.data as { message?: string })?.message || 'Registration failed. Please try again.');
    }
  };
  const handleSaveLocation = async () => {
  if (!token || !countryCode || !city) return;
  setSavingLocation(true);
  setLocationError('');
  const result = await apiCall('/users/me', {
    method: 'PATCH',
    body: { country: countryCode, city },
    token
  });
  setSavingLocation(false);
  if (result.status === 200) {
    setUserProfile((prev) => ({ ...prev, country: countryCode, city }));
  } else {
    setLocationError((result.data as { message?: string })?.message || 'Could not save location.');
  }
};

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !slotDate || !slotTime) return;

    setAddingSlot(true);
    setSlotMessage('');

    const start = new Date(`${slotDate}T${slotTime}`);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const result = await apiCall('/doctors/availability', {
      method: 'POST',
      body: { startTime: start.toISOString(), endTime: end.toISOString(),capacity: Number(slotCapacity) },
      token
    });
    setAddingSlot(false);

    if (result.status === 201) {
      setSlotMessage('✓ Slot added successfully.');
      setSlotDate('');
      setSlotTime('');
    } else {
      setSlotMessage((result.data as { message?: string })?.message || 'Could not add slot.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!token) return;
    setUpdatingId(id);
    const result = await apiCall(`/consultations/${id}/status`, {
      method: 'PATCH',
      body: { status: newStatus },
      token
    });
    setUpdatingId(null);

    if (result.status === 200) {
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus as AssignedConsultation['status'] } : c))
      );
    } else {
      alert((result.data as { message?: string })?.message || 'Could not update status.');
    }
  };

  const handleTogglePrescriptions = async (id: string) => {
    if (!token) return;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (prescriptions[id]) return;

    const result = await apiCall<{ data: Prescription[] }>(`/consultations/${id}/prescriptions`, { token });
    if (result.status === 200) {
      setPrescriptions((prev) => ({ ...prev, [id]: result.data.data || [] }));
    }
  };

  const handleSavePrescription = async (id: string) => {
    if (!token) return;
    const details = prescriptionDrafts[id]?.trim();
    if (!details) return;

    setSavingPrescriptionId(id);
    const result = await apiCall<{ data: Prescription }>(`/consultations/${id}/prescriptions`, {
      method: 'POST',
      body: { details },
      token
    });
    setSavingPrescriptionId(null);

    if (result.status === 201) {
      setPrescriptions((prev) => ({ ...prev, [id]: [...(prev[id] || []), result.data.data] }));
      setPrescriptionDrafts((prev) => ({ ...prev, [id]: '' }));
    } else {
      alert((result.data as { message?: string })?.message || 'Could not save prescription.');
    }
  };

  if (authLoading || pageState === 'loading') {
    return (
      <main className="max-w-4xl mx-auto p-6 md:p-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  const needsSpecialty = !profile;
  const needsLocation = !userProfile?.country || !userProfile?.city;

  return (
    <main className="max-w-4xl mx-auto p-6 md:p-10 animate-fade-in w-full">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Doctor Dashboard</h1>
        <p className="text-slate-500 mt-2">Manage your availability, profile, and active consultations.</p>
      </div>

      {(needsSpecialty || needsLocation) ? (
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-xl font-bold text-slate-900">Complete Your Doctor Profile</h2>
          </div>
          <p className="text-slate-600 mb-6 ml-9">
            A few details are needed before you can start adding availability slots and receiving bookings.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-9">
            {needsLocation && (
              <div className="bg-white p-6 rounded-xl border border-sky-100 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span>📍</span> Your Location
                </h3>
                <div className="flex flex-col gap-4 mb-4">
                  <select
                    value={countryCode}
                    onChange={(e) => { setCountryCode(e.target.value); setCity(''); }}
                    className="input-field"
                  >
                    <option value="">Select country</option>
                    {countries?.map((c) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                  </select>
                  <select
                    value={city}
                    disabled={!countryCode}
                    onChange={(e) => setCity(e.target.value)}
                    className="input-field disabled:opacity-50 disabled:bg-slate-100"
                  >
                    <option value="">Select city</option>
                    {citiesForCountry?.map((ct, idx) => (
                      <option key={`${ct.name}-${ct.stateCode}-${idx}`} value={ct.name}>{ct.name}</option>
                    ))}
                  </select>
                </div>
                {locationError && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{locationError}</p>}
                <button
                  onClick={handleSaveLocation}
                  disabled={savingLocation || !countryCode || !city}
                  className="btn-primary w-full"
                >
                  {savingLocation ? 'Saving...' : 'Save Location'}
                </button>
              </div>
            )}

            {needsSpecialty && (
              <div className="bg-white p-6 rounded-xl border border-sky-100 shadow-sm">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span>⚕️</span> Your Specialty
                </h3>
                <input
                  type="text"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  placeholder="e.g. Cardiology, Dermatology"
                  className="input-field mb-4"
                />
                {registerError && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{registerError}</p>}
                <button
                  onClick={handleRegisterAsDoctor}
                  disabled={registering || !specialtyInput.trim()}
                  className="btn-primary w-full"
                >
                  {registering ? 'Registering...' : 'Register as Doctor'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile & Tools */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profile Card */}
            <div className="card bg-gradient-to-br from-white to-sky-50/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xl font-bold">
                  {userProfile?.city ? userProfile.city.charAt(0) : 'D'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{profile.specialty}</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-2 h-2 rounded-full ${profile.verified ? 'bg-green-500' : 'bg-amber-400'}`}></span>
                    <p className="text-slate-500 text-xs font-medium">
                      {profile.verified ? 'Verified Practitioner' : 'Verification Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Add Slot Card */}
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <span>➕</span> Add Availability Slot
              </h3>
              <p className="text-xs text-slate-500 mb-4">Slots are automatically set to 30 minutes duration.</p>
              
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    required
                    className="input-field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Time</label>
                  <input
                    type="time"
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    required
                    className="input-field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Patient Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={slotCapacity}
                    onChange={(e) => setSlotCapacity(e.target.value)}
                    className="input-field py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingSlot}
                  className="btn-primary w-full py-2 text-sm mt-2"
                >
                  {addingSlot ? 'Adding...' : 'Add Slot'}
                </button>
              </form>
              {slotMessage && (
                <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                  slotMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  <span>{slotMessage.includes('successfully') ? '✓' : '⚠️'}</span>
                  {slotMessage}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Consultations */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Upcoming Appointments</h2>
              <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-semibold">
                {consultations.length} total
              </span>
            </div>
            
            {consultations.length === 0 ? (
              <div className="card text-center py-16 border-dashed">
                <div className="text-4xl mb-4 opacity-50">👥</div>
                <h3 className="text-lg font-medium text-slate-800 mb-1">No appointments yet</h3>
                <p className="text-slate-500">When patients book your slots, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((c) => {
                  const start = new Date(c.start_time);
                  const end = new Date(c.end_time);
                  const isExpanded = expandedId === c.id;
                  const canChat = CHATTABLE_STATUSES.includes(c.status);

                  return (
                    <div key={c.id} className="card p-0 overflow-hidden">
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 border-b border-slate-100 pb-4">
                          <div>
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Patient Name</div>
                            <div className="font-bold text-lg text-slate-900">
                              {c.patient_name || 'Patient (name unavailable)'}
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_STYLES[c.status] || 'bg-slate-100 text-slate-600'}`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-6 mb-5 text-sm">
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-lg">📅</span>
                            <span className="font-medium">{start.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-lg">⏰</span>
                            <span className="font-medium">
                              {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl">
                          {c.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'in_progress')}
                              disabled={updatingId === c.id}
                              className="btn-primary py-1.5 px-4 text-sm"
                            >
                              {updatingId === c.id ? 'Starting...' : 'Start Consultation'}
                            </button>
                          )}
                          
                          {c.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusChange(c.id, 'completed')}
                              disabled={updatingId === c.id}
                              className="bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-4 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
                            >
                              {updatingId === c.id ? 'Marking...' : 'Mark as Completed'}
                            </button>
                          )}

                          {(c.status === 'in_progress' || c.status === 'completed') && (
                            <button
                              onClick={() => handleTogglePrescriptions(c.id)}
                              className="btn-secondary py-1.5 px-4 text-sm bg-white"
                            >
                              {isExpanded ? 'Close Prescriptions' : 'Manage Prescriptions'}
                            </button>
                          )}

                          {canChat && (
                            <button
                              onClick={() => setChatOpenId(chatOpenId === c.id ? null : c.id)}
                              className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition-all ml-auto ${
                                chatOpenId === c.id 
                                  ? 'bg-slate-800 text-white hover:bg-slate-900' 
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {chatOpenId === c.id ? 'Close Chat' : 'Open Chat Window'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Prescription Area */}
                      {isExpanded && (
                        <div className="bg-sky-50/50 p-5 border-t border-sky-100 animate-fade-in">
                          <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <span>✍️</span> Prescription Pad
                          </h4>
                          
                          {prescriptions[c.id]?.length ? (
                            <div className="space-y-3 mb-5">
                              {prescriptions[c.id].map((p) => (
                                <div key={p.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative">
                                  <div className="absolute top-4 right-4 text-xs font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded">
                                    ISSUED
                                  </div>
                                  <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                                    Date: {new Date(p.issued_at).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                  </div>
                                  <div className="whitespace-pre-wrap text-slate-700 font-medium leading-relaxed pr-16">{p.details}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white p-4 rounded-lg border border-slate-200 mb-5 text-center text-slate-500 text-sm">
                              No prescriptions written yet.
                            </div>
                          )}

                          <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-sm">
                            <label className="block text-xs font-medium text-slate-600 mb-2">Draft New Prescription</label>
                            <textarea
                              value={prescriptionDrafts[c.id] || ''}
                              onChange={(e) =>
                                setPrescriptionDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                              }
                              placeholder="Type medicines, dosage, and tests recommended..."
                              rows={4}
                              className="input-field mb-3 py-2 text-sm bg-slate-50"
                            />
                            <button
                              onClick={() => handleSavePrescription(c.id)}
                              disabled={savingPrescriptionId === c.id || !prescriptionDrafts[c.id]?.trim()}
                              className="btn-primary w-full py-2"
                            >
                              {savingPrescriptionId === c.id ? 'Saving...' : 'Issue Prescription'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Chat Widget Area */}
                      {chatOpenId === c.id && token && (
                        <div className="bg-slate-50 p-5 border-t border-slate-200 animate-fade-in">
                          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-slate-800 text-white px-4 py-3 text-sm font-semibold flex justify-between items-center">
                              <span>Live Consultation Room</span>
                              <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                Active
                              </span>
                            </div>
                            <ConsultationChat consultationId={c.id} token={token} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
