import { NextResponse } from 'next/server';
import { api, clientKey, sessionCookie } from '@/lib/auth';
import { assertNotThrottled, createSession, recordFailedLogin, setupWorkspace } from '@/lib/db';

export const POST = api(async ({ body }) => {
  const key = `${await clientKey()}|setup`;
  await assertNotThrottled(key);
  await recordFailedLogin(key); // counts toward the limit so setup cannot be hammered
  const user = await setupWorkspace(body);
  return sessionCookie(NextResponse.json({ user }), await createSession(user.id));
}, { auth: 'none' });
