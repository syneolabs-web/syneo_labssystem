import { api, clientKey } from '@/lib/auth';
import { assertNotThrottled, recordFailedLogin, requestAccess } from '@/lib/db';

// Public "Request access": creates a pending member account that an administrator must approve.
export const POST = api(async ({ body }) => {
  const key = `${await clientKey()}|signup`;
  await assertNotThrottled(key);
  await recordFailedLogin(key); // every request counts, so the form cannot be flooded
  await requestAccess({ name: body.name, email: body.email, password: body.password, department: body.department });
  return { ok: true, pending: true };
}, { auth: 'none' });