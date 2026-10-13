import { api } from '@/lib/auth';
import { manageTimeEntry } from '@/lib/db';

// body.action: 'stop' | 'update' | 'delete'
export const POST = api(({ body }) => manageTimeEntry(body.action, body.id, body), { auth: 'admin' });