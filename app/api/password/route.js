import { NextResponse } from 'next/server';
import { api, sessionCookie } from '@/lib/auth';
import { HttpError, updatePassword, verifyCredentials } from '@/lib/db';

export const POST = api(async ({ body, user }) => {
  if (!(await verifyCredentials(user.email, body.current))) throw new HttpError(400, 'Current password is incorrect');
  await updatePassword(user.id, body.password);
  return sessionCookie(NextResponse.json({ signout: true }), '');
});
