import { api } from '@/lib/auth';
import { deleteRecord } from '@/lib/db';

export const POST = api(({ body, user }) => deleteRecord(body.id, user));