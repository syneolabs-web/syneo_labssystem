import { api } from '@/lib/auth';
import { updateUserPreferences } from '@/lib/db';

export const POST = api(async ({ user, body }) => {
  return updateUserPreferences(user, body || {});
});
