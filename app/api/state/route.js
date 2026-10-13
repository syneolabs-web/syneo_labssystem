import { api } from '@/lib/auth';
import { getWorkspaceState } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = api(({ user }) => getWorkspaceState(user));
