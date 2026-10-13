import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { api, COOKIE, sessionCookie } from '@/lib/auth';
import { deleteSession } from '@/lib/db';

export const POST = api(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) await deleteSession(token);
  return sessionCookie(NextResponse.json({ ok: true }), '');
}, { auth: 'none' });
