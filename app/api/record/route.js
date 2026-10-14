import { after } from 'next/server';
import { api } from '@/lib/auth';
import { saveRecord, generateGoogleMeetRoom } from '@/lib/db';
import { processJobs } from '@/lib/delivery';

export const POST = api(async ({ body, user }) => {
  if (body.action === 'generateMeetLink') {
    return generateGoogleMeetRoom(body.body, user);
  }
  const id = await saveRecord(body.kind, body.id, body.body, user);
  const queuedJob =
    body.kind === 'leads' ||
    body.kind === 'meetings' ||
    Boolean(body.body?.notifyEmail || body.body?.notifyEveryone || body.body?.sendToEveryone);
  if (queuedJob) {
    try {
      if (typeof after === 'function') {
        after(async () => {
          try {
            await processJobs();
          } catch (e) {
            console.error('Email/Job delivery error:', e.message);
          }
        });
      }
    } catch {}
    processJobs().catch(e => console.error('Immediate delivery error:', e.message));
  }
  return { id };
});


