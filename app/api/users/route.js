import { api } from '@/lib/auth';
import { approveRequest, createUser, HttpError, manageDepartment, managePosition, rejectRequest, removeUser, setMemberLimit, updateMember } from '@/lib/db';

// body.action: 'create' (default) | 'update' | 'remove' | 'approve' | 'reject' | 'limit' | 'addDepartment' | 'removeDepartment' | 'addPosition' | 'removePosition'
export const POST = api(async ({ body, user }) => {
  const action = body.action || 'create';
  if (action === 'create') return { ok: true, user: await createUser(body, body.role || 'member') };
  if (action === 'addDepartment' || action === 'removeDepartment') {
    const departments = await manageDepartment(action, body.department || body.name, user);
    return { ok: true, departments };
  }
  if (action === 'addPosition' || action === 'removePosition') {
    const positions = await managePosition(action, body.position || body.name, user);
    return { ok: true, positions };
  }
  if (action === 'update') await updateMember(user, body.id, body);
  else if (action === 'remove') await removeUser(user, body.id);
  else if (action === 'approve') await approveRequest(body.id);
  else if (action === 'reject') await rejectRequest(body.id);
  else if (action === 'limit') await setMemberLimit(body.memberLimit);
  else throw new HttpError(400, 'Invalid action');
  return { ok: true };
}, { auth: 'admin' });