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
   const forceFail = env.allowPaymentSimulation && simulateFailure; // NEW
  const lockToken = await acquireLock(`slot:${slotId}`);
  if (!lockToken) {
     slotLockContentionTotal.inc(); // NEW
    throw new ApiError(409, 'Slot is currently being booked by someone else — try again in a moment');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const slot = await bookingsRepo.getSlotForUpdate(client, slotId);
    if (!slot) throw new ApiError(404, 'Slot not found');
    if (slot.status !== 'open') throw new ApiError(409, 'Slot is no longer available');

    const consultation = await bookingsRepo.createConsultation(client, { slotId, patientId });
    await bookingsRepo.markSlotBooked(client, slotId);

    // Saga ka "risky" external step — payment
    const paymentResult = await mockChargePayment(CONSULTATION_FEE, forceFail);

    if (!paymentResult.success) {
      // Compensating action: booking + slot status change dono undo,
      // kyunki payment fail hua toh consultation valid nahi hai
      await client.query('ROLLBACK');
       bookingsFailedTotal.inc({ reason: 'payment_declined' }); // NEW
       await logAction({ actorId: patientId, action: 'booking_failed', metadata: { slotId, reason: paymentResult.reason } });
      throw new ApiError(402, `Payment failed: ${paymentResult.reason}. Booking was not created.`);
    }

    await bookingsRepo.createPayment(client, {
      consultationId: consultation.id,
      amount: CONSULTATION_FEE,
      status: 'success'
    });
    const confirmed = await bookingsRepo.updateConsultationStatus(client, consultation.id, 'confirmed');
  await logAction({ actorId: patientId, action: 'booking_created', metadata: { consultationId: confirmed.id, slotId } }, client);
    await client.query('COMMIT');
    const patient = await findUserById(patientId); // email chahiye notification ke liye
await queueBookingConfirmation(patient.email, confirmed.id).catch((err) =>
  logger.error({ err }, 'Failed to queue booking confirmation — booking itself succeeded')
);
    return confirmed;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {}); // dobara ROLLBACK harmless hai agar transaction already band ho chuki
    throw err;
  } finally {
    client.release();
    await releaseLock(`slot:${slotId}`, lockToken);
  }
};
