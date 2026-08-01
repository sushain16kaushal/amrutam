import { apiCall } from '@/lib/api';
import { Doctor, AvailabilitySlot } from '@/types';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import { DoctorReviewsData } from '@/types';
import SlotTime from '@/components/SlotTime';
type Props = { params: Promise<{ doctorId: string }> };

export default async function DoctorDetailPage({ params }: Props) {
  const { doctorId } = await params; // Next.js 16 mein params bhi Promise hai, jaise searchParams
  // Doctor detail aur availability dono parallel fetch karo.
  // Doctor-detail endpoint abhi confirm nahi hai ki backend mein hai ya nahi,
  // isliye ise safely handle kar rahe hain — fail hua to bhi slots dikhte rahenge.
const [doctorResult, slotsResult, reviewsResult] = await Promise.allSettled([
  apiCall<{ data: Doctor }>(`/doctors/${doctorId}`),
  apiCall<{ data: AvailabilitySlot[] }>(`/doctors/${doctorId}/availability`),
  apiCall<{ data: DoctorReviewsData }>(`/doctors/${doctorId}/reviews`)
]);


  const doctor =
    doctorResult.status === 'fulfilled' && doctorResult.value.status === 200
      ? doctorResult.value.data.data
      : null;

  const slots =
    slotsResult.status === 'fulfilled' && slotsResult.value.status === 200
      ? slotsResult.value.data.data
      : [];

  const reviewsData =
    reviewsResult.status === 'fulfilled' && reviewsResult.value.status === 200
      ? reviewsResult.value.data.data
      : { averageRating: 0, totalReviews: 0 ,reviews: []};

  const openSlots = slots.filter((s) => s.status === 'open');
  

  return (
    <main className="max-w-2xl mx-auto p-6 animate-fade-in">
      <Link href="/doctors" className="text-sm text-gray-500 hover:underline">
        &larr; Back to search
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-semibold">
          {doctor?.full_name || 'Dr. (details unavailable)'}
        </h1>
        <p className="text-gray-500">{doctor?.specialty || 'Specialty not available'}</p>
        {doctor?.verified && (
          <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
            Verified
          </span>
        )}
        {reviewsData && reviewsData.totalReviews > 0 && (
  <div className="flex items-center gap-2 mt-2">
    <StarRating value={reviewsData.averageRating || 0} readOnly size="sm" />
    <span className="text-sm text-gray-500">
      {reviewsData.averageRating} ({reviewsData.totalReviews} review{reviewsData.totalReviews !== 1 ? 's' : ''})
    </span>
  </div>
)}
{reviewsData && reviewsData.reviews.length > 0 && (
  <div className="mt-4 space-y-3">
    {reviewsData.reviews.map((r) => (
      <div key={r.id} className="border-t pt-3">
        <div className="flex justify-between items-center">
          <span className="font-medium text-sm">{r.patient_name || 'Patient'}</span>
          <StarRating value={r.rating} readOnly size="sm" />
        </div>
        {r.review_text && (
          <p className="text-sm text-gray-700 mt-1">{r.review_text}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
        </p>
      </div>
    ))}
  </div>
)}
      </div>

      <h2 className="text-lg font-medium mb-3">Available Slots</h2>

     {openSlots.map((slot) => {
  const seatsLeft = slot.capacity - slot.booked_count;
  const isFull = seatsLeft <= 0;

  return isFull ? (
    <div key={slot.id} className="card opacity-50 cursor-not-allowed">
      <SlotTime startTime={slot.start_time} endTime={slot.end_time} />
      <span className="inline-block mt-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
        Housefull
      </span>
    </div>
  ) : (
    <Link key={slot.id} href={`/booking/${slot.id}?doctorId=${doctorId}`} className="card block">
      <SlotTime startTime={slot.start_time} endTime={slot.end_time} />
      <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
        {seatsLeft} slot{seatsLeft !== 1 ? 's' : ''} left
      </span>
    </Link>
  );
})}
    </main>
  );
}
