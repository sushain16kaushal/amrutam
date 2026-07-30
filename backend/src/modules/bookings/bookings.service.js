import pool from '../../config/db.js';
import * as bookingsRepo from './bookings.repository.js';
import { acquireLock, releaseLock } from '../../utils/redisLock.js';
import { ApiError } from '../../utils/apiError.js';
import { logAction } from '../../utils/auditLogger.js';
import { env } from '../../config/env.js';
import { bookingsCreatedTotal, bookingsFailedTotal, slotLockContentionTotal } from '../../utils/metrics.js';
import { queueBookingConfirmation } from '../../jobs/notification.queue.js';
import { findUserById } from '../auth/auth.repository.js';
const CONSULTATION_FEE = 500; // flat fee — real pricing logic scope se bahar hai

// Mock payment gateway — real provider hit nahi karta.
// `forceFail=true` bhejo to simulate karo ki payment decline ho gaya
// (demo video ke liye rollback dikhane ke kaam aayega)
const mockChargePayment = async (amount, forceFail = false) => {
  await new Promise((resolve) => setTimeout(resolve, 200)); // network latency simulate
  if (forceFail) return { success: false, reason: 'Card declined (simulated for demo)' };
  return { success: true, reference: `mock_txn_${Date.now()}` };
};
export const bookSlot = async (patientId, { slotId, simulateFailure = false }) => {
  const lockToken = await acquireLock(`slot:${slotId}`);
  if (!lockToken) {
    throw new ApiError(409, 'Slot is currently being booked by someone else — try again in a moment');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const slot = await bookingsRepo.getSlotForUpdate(client, slotId); // row lock — capacity check race-safe rahega
    if (!slot) throw new ApiError(404, 'Slot not found');
    if (slot.status !== 'open') throw new ApiError(409, 'Slot is no longer available');

    // NEW — same patient dobara isi slot ko book na kar paaye
    const alreadyBooked = await bookingsRepo.hasActiveBooking(client, slotId, patientId);
    if (alreadyBooked) {
      throw new ApiError(409, 'You have already booked this slot');
    }

    // NEW — capacity check, status check ki jagah
    const activeCount = await bookingsRepo.countActiveBookings(client, slotId);
    if (activeCount >= slot.capacity) {
      throw new ApiError(409, 'This slot is fully booked (Housefull)');
    }

    const consultation = await bookingsRepo.createConsultation(client, { slotId, patientId });
    // markSlotBooked call hataya — capacity-based model mein zaroorat nahi

    const paymentResult = await mockChargePayment(CONSULTATION_FEE, simulateFailure);

    if (!paymentResult.success) {
      await client.query('ROLLBACK');
      throw new ApiError(402, `Payment failed: ${paymentResult.reason}. Booking was not created.`);
    }

    await bookingsRepo.createPayment(client, {
      consultationId: consultation.id,
      amount: CONSULTATION_FEE,
      status: 'success'
    });
    const confirmed = await bookingsRepo.updateConsultationStatus(client, consultation.id, 'confirmed');

    await client.query('COMMIT');
    return confirmed;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await releaseLock(`slot:${slotId}`, lockToken);
  }
};