import { api } from '@/lib/auth';
import { clockAction } from '@/lib/db';

export const POST = api(({ body, user }) => clockAction(body.action, user.id, body));
