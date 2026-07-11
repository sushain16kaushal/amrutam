import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register }); // CPU, memory, event loop lag — automatic

// Har HTTP request ki duration track karega, route + method + status ke hisaab se breakdown
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5] // p95/p99 nikalne ke liye buckets
});

// Business-level metrics — sirf "server up hai" nahi, "business kaam kar raha hai" bhi dikhta hai
export const bookingsCreatedTotal = new client.Counter({
  name: 'bookings_created_total',
  help: 'Total successful bookings'
});

export const bookingsFailedTotal = new client.Counter({
  name: 'bookings_failed_total',
  help: 'Total failed booking attempts',
  labelNames: ['reason'] // 'payment_declined' | 'slot_unavailable' | 'lock_contention'
});

export const slotLockContentionTotal = new client.Counter({
  name: 'slot_lock_contention_total',
  help: 'Times a booking request was rejected because the slot was already locked'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(bookingsCreatedTotal);
register.registerMetric(bookingsFailedTotal);
register.registerMetric(slotLockContentionTotal);

export default register;