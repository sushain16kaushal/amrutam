'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { Doctor, AvailabilitySlot, Consultation } from '@/types';

const CONSULTATION_FEE = 500; // backend se nahi aata — display ke liye yahin fixed rakha hai

type BookingEnvelope = {
  success: boolean;
  data?: Consultation;
  message?: string;
};

type PageState = 'loading' | 'ready' | 'not-found' | 'load-error';
type BookingState = 'idle' | 'processing' | 'success' | 'error';

export default function BookingPage() {
  const { slotId } = useParams<{ slotId: string }>();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slot, setSlot] = useState<AvailabilitySlot | null>(null);

  const [bookingState, setBookingState] = useState<BookingState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedConsultation, setConfirmedConsultation] = useState<Consultation | null>(null);

  // Idempotency key ek baar generate hota hai jab page load hota hai, aur poore
  // is page-visit ke duration mein reuse hota hai — isse agar request retry ho
  // (network hiccup ya button double-click), backend duplicate booking nahi banayega.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  // Auth guard: login zaroori hai booking ke liye
  useEffect(() => {
    if (!authLoading && !token) {
      router.push(`/login?next=/booking/${slotId}${doctorId ? `?doctorId=${doctorId}` : ''}`);
    }
  }, [authLoading, token, router, slotId, doctorId]);

  // Doctor + slot detail fetch karo
  useEffect(() => {
    if (!doctorId) {
      setPageState('not-found');
      return;
    }

    const fetchDetails = async () => {
      try {
        const [doctorResult, slotsResult] = await Promise.all([
          apiCall<{ data: Doctor }>(`/doctors/${doctorId}`),
          apiCall<{ data: AvailabilitySlot[] }>(`/doctors/${doctorId}/availability`)
        ]);

        if (doctorResult.status !== 200) {
          setPageState('load-error');
          return;
        }

        const matchedSlot = slotsResult.data.data?.find((s) => s.id === slotId);
        if (!matchedSlot) {
          setPageState('not-found'); // slot ab available nahi, ya kisi aur ne book kar liya
          return;
        }

        setDoctor(doctorResult.data.data);
        setSlot(matchedSlot);
        setPageState('ready');
      } catch {
        setPageState('load-error');
      }
    };

    fetchDetails();
  }, [doctorId, slotId]);

  const handleConfirmAndPay = async (simulateFailure = false) => {
    if (!token) return;
    setBookingState('processing');
    setErrorMessage('');

    const result = await apiCall<BookingEnvelope>('/bookings', {
      method: 'POST',
      body: { slotId, simulateFailure },
      token,
      idempotencyKey
    });

    if (result.status === 201 && result.data.success && result.data.data) {
      setConfirmedConsultation(result.data.data);
      setBookingState('success');
    } else {
      setErrorMessage(result.data.message || 'Booking failed. Please try again.');
      setBookingState('error');
      if (simulateFailure) {
        alert('Payment cancelled. Transaction rolled back, slot remains open.');
        router.push(doctorId ? `/doctors/${doctorId}` : '/doctors');
      }
    }
  };

  if (authLoading || pageState === 'loading') {
    return <main className="max-w-xl mx-auto p-6 text-gray-500">Loading...</main>;
  }

  if (pageState === 'not-found') {
    return (
      <main className="max-w-xl mx-auto p-6">
        <p className="text-red-600 mb-4">
          This slot is no longer available — it may have just been booked by someone else.
        </p>
        <Link href="/doctors" className="text-blue-600 hover:underline">
          &larr; Back to doctor search
        </Link>
      </main>
    );
  }

  if (pageState === 'load-error') {
    return (
      <main className="max-w-xl mx-auto p-6">
        <p className="text-red-600 mb-4">Something went wrong loading this booking. Please try again.</p>
        <Link href="/doctors" className="text-blue-600 hover:underline">
          &larr; Back to doctor search
        </Link>
      </main>
    );
  }

  // bookingState === 'success'
  if (bookingState === 'success' && confirmedConsultation) {
    return (
      <main className="max-w-xl mx-auto p-6 animate-fade-in">
        <div className="card text-center py-10">
          <div className="text-green-600 text-3xl mb-2">✓</div>
          <h1 className="text-xl font-semibold mb-2">Booking Confirmed</h1>
          <p className="text-gray-500 mb-1">
            Consultation ID: <span className="font-mono text-sm">{confirmedConsultation.id}</span>
          </p>
          <p className="text-gray-500 mb-6">Status: {confirmedConsultation.status}</p>
          <Link href="/consultations" className="inline-block px-4 py-2 bg-blue-600 text-white rounded">
            View My Consultations
          </Link>
        </div>
      </main>
    );
  }

  // pageState === 'ready' — slot summary + confirm & pay
  const start = slot ? new Date(slot.start_time) : null;
  const end = slot ? new Date(slot.end_time) : null;

  return (
    <main className="max-w-xl mx-auto p-6 animate-fade-in">
      <Link href={`/doctors/${doctorId}`} className="text-sm text-gray-500 hover:underline">
        &larr; Back to doctor
      </Link>

      <h1 className="text-2xl font-semibold mt-4 mb-6">Confirm Your Booking</h1>

      <div className="card mb-6">
        <div className="font-medium text-lg">{doctor?.full_name || 'Dr. (name unavailable)'}</div>
        <div className="text-gray-500 mb-4">{doctor?.specialty}</div>

        {start && end && (
          <div className="text-sm text-gray-700">
            <div>
              {start.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div>
              {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} –{' '}
              {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <span className="text-gray-500">Consultation Fee</span>
          <span className="font-semibold">₹{CONSULTATION_FEE}</span>
        </div>
      </div>

      {bookingState === 'error' && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{errorMessage}</div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleConfirmAndPay(false)}
          disabled={bookingState === 'processing'}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sky-200 shadow-md"
        >
          {bookingState === 'processing' ? 'Processing payment...' : `Confirm & Pay ₹${CONSULTATION_FEE}`}
        </button>

        <button
          onClick={() => handleConfirmAndPay(true)}
          disabled={bookingState === 'processing'}
          className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg disabled:opacity-50 transition-colors border border-red-200"
        >
          Simulate Cancel/Fail Payment (Rollback)
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        This is a simulated payment for demo purposes — no real charge will occur.
      </p>
    </main>
  );
}
