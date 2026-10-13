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
    Boolean(body.body?.notifyEmail || body.body?.notifyEveryone);
  if (queuedJob) after(processJobs);
  return { id };
});


