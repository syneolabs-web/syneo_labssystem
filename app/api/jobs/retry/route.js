import { api } from '@/lib/auth';
import { retryJobs } from '@/lib/db';
import { processJobs } from '@/lib/delivery';

export const POST = api(async () => {
  await retryJobs();
  await processJobs();
}, { auth: 'admin' });
