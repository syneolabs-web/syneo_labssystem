import { NextResponse } from 'next/server';
import { api, clientKey, sessionCookie } from '@/lib/auth';
import { assertNotThrottled, createSession, HttpError, recordFailedLogin, verifyCredentials } from '@/lib/db';

export const POST = api(async ({ body }) => {
  // Per IP + account, so colleagues behind one office IP don't lock each other out.
  const key = `${await clientKey()}|${String(body.email || '').trim().toLowerCase().slice(0, 254)}`;
  await assertNotThrottled(key);
  const user = await verifyCredentials(body.email, body.password);
  if (!user) {
    await recordFailedLogin(key);
    throw new HttpError(401, 'Incorrect email or password');
  }
  return sessionCookie(NextResponse.json({ user }), await createSession(user.id));
}, { auth: 'none' });
