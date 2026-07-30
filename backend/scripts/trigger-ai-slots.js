import { maintenanceQueue } from '../src/config/queue.js';

const run = async () => {
  await maintenanceQueue.add('generate-ai-slots', {});
  console.log('Job queued — check worker logs for output');
  process.exit(0);
};

run();