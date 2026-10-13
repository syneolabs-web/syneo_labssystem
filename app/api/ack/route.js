import { api } from '@/lib/auth';
import { acknowledge } from '@/lib/db';

export const POST = api(({ body, user }) => acknowledge(body.id, user));
