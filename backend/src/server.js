// server.js
import './tracing.js';
import app from './app.js';
import { env } from './config/env.js';
import './jobs/notification.worker.js'; // NEW — worker process start ho jaye
app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});