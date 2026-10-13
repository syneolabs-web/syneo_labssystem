import { api, getAuthUser } from '@/lib/auth';
import { getWorkspaceDefaults, signupOpen, userCount } from '@/lib/db';

export const GET = api(async () => ({
  user: await getAuthUser(),
  needsSetup: (await userCount()) === 0,
  signupOpen: await signupOpen(),
  workspaceDefaults: await getWorkspaceDefaults()
}), { auth: 'none' });