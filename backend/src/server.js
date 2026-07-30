import './tracing.js';
import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import './jobs/notification.worker.js';
import './jobs/maintenance.worker.js';
import { scheduleSlotExpiry, scheduleAiSlotGeneration, scheduleModerationAutoResolve ,scheduleConsultationExpiry} from './jobs/maintenance.queue.js'; // UPDATED — naya import add hua
import { initSocket } from './utils/socket.js';

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, async () => {
  console.log(`Server running on port ${env.port}`);
  await scheduleSlotExpiry();
  await scheduleAiSlotGeneration();
  await scheduleModerationAutoResolve(); // NEW
  await scheduleConsultationExpiry(); // NEW
});