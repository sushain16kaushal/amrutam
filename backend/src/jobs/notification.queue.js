import { notificationQueue } from '../config/queue.js';

export const queueBookingConfirmation = async (patientEmail, consultationId) => {
  await notificationQueue.add('booking-confirmation', {
    type: 'email',
    to: patientEmail,
    message: `Your consultation ${consultationId} is confirmed.`
  });
};

export const queueCancellationNotice = async (patientEmail, consultationId) => {
  await notificationQueue.add('cancellation-notice', {
    type: 'email',
    to: patientEmail,
    message: `Your consultation ${consultationId} was cancelled.`
  });
};