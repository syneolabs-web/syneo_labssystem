// End-to-end API checks against a running server with an EMPTY database.
//   BASE_URL=http://localhost:3000 node --test tests/
// Never point this at production: it creates the first administrator.
import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL;
const skip = !BASE && 'set BASE_URL to a server with an empty test database';

function client() {
  let cookie = '';
  return async (path, body, { origin = BASE } = {}) => {
    const res = await fetch(BASE + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return { status: res.status, data: await res.json() };
  };
}

const ADMIN = { name: 'Test Admin', email: 'admin@test.local', password: 'admin-password-123' };
const MEMBER = { name: 'Test Member', email: 'member@test.local', password: 'member-password-123', department: 'Design' };

test('workspace lifecycle, permissions and security', { skip }, async t => {
  const admin = client();
  const member = client();
  const anon = client();

  await t.test('first-run setup happens exactly once', async () => {
    assert.equal((await anon('/api/session')).data.needsSetup, true);
    assert.equal((await anon('/api/setup', { ...ADMIN, password: 'short' })).status, 400);
    const ok = await admin('/api/setup', ADMIN);
    assert.equal(ok.status, 200);
    assert.equal(ok.data.user.role, 'admin');
    assert.equal((await anon('/api/setup', { ...ADMIN, email: 'x@test.local' })).status, 409);
    assert.equal((await anon('/api/session')).data.needsSetup, false);
  });

  await t.test('cross-origin writes are rejected', async () => {
    const r = await admin('/api/record', { kind: 'projects', body: { title: 'X' } }, { origin: 'https://evil.example' });
    assert.equal(r.status, 403);
  });

  await t.test('unauthenticated access is refused', async () => {
    assert.equal((await anon('/api/state')).status, 401);
    assert.equal((await anon('/api/record', { kind: 'tasks', body: { title: 'x', status: 'To do' } })).status, 401);
  });

  let memberId;
  await t.test('admin adds a member who can sign in', async () => {
    assert.equal((await admin('/api/users', MEMBER)).status, 200);
    assert.equal((await admin('/api/users', MEMBER)).status, 409);
    assert.equal((await member('/api/login', { email: MEMBER.email, password: 'wrong-password-xx' })).status, 401);
    const r = await member('/api/login', { email: MEMBER.email.toUpperCase(), password: MEMBER.password });
    assert.equal(r.status, 200);
    memberId = r.data.user.id;
    const state = (await member('/api/state')).data;
    assert.equal(state.users.length, 2);
    assert.ok(state.users.every(u => !('password' in u)));
    assert.deepEqual(state.jobs, []);
  });

  await t.test('sign-up requests need admin approval and respect the team size limit', async () => {
    const applicant = client();
    const APPLICANT = { name: 'Applicant', email: 'applicant@test.local', password: 'applicant-pass-123', department: 'Design', role: 'admin' };
    assert.equal((await anon('/api/session')).data.signupOpen, true);
    assert.equal((await applicant('/api/signup', APPLICANT)).status, 200);
    assert.equal((await applicant('/api/signup', APPLICANT)).status, 409, 'duplicate email');
    const pendingLogin = await applicant('/api/login', { email: APPLICANT.email, password: APPLICANT.password });
    assert.equal(pendingLogin.status, 403);
    assert.match(pendingLogin.data.error, /approval/);
    assert.equal((await applicant('/api/state')).status, 401);

    const memberView = (await member('/api/state')).data;
    assert.ok(!memberView.users.some(u => u.email === APPLICANT.email), 'pending people are not listed as colleagues');
    assert.deepEqual(memberView.requests, []);
    assert.equal(memberView.settings, null);
    const req = (await admin('/api/state')).data.requests.find(r => r.email === APPLICANT.email);
    assert.equal(req.role, 'member', 'sign-up can never create an admin');
    assert.equal((await member('/api/users', { action: 'approve', id: req.id })).status, 403);

    // Limit: 2 active + 1 pending = 3 seats used
    assert.equal((await admin('/api/users', { action: 'limit', memberLimit: -1 })).status, 400);
    assert.equal((await admin('/api/users', { action: 'limit', memberLimit: 3 })).status, 200);
    assert.equal((await anon('/api/session')).data.signupOpen, false);
    const blocked = await anon('/api/signup', { name: 'Late', email: 'late@test.local', password: 'late-password-123' });
    assert.equal(blocked.status, 403);
    assert.match(blocked.data.error, /limit/);
    assert.equal((await admin('/api/users', { action: 'limit', memberLimit: 2 })).status, 200);
    assert.equal((await admin('/api/users', { action: 'approve', id: req.id })).status, 409, 'cannot approve past the limit');
    assert.equal((await admin('/api/users', { name: 'Extra', email: 'extra@test.local', password: 'extra-password-123' })).status, 409, 'admin add respects the limit');

    assert.equal((await admin('/api/users', { action: 'limit', memberLimit: 20 })).status, 200);
    assert.equal((await admin('/api/users', { action: 'approve', id: req.id })).status, 200);
    assert.equal((await admin('/api/users', { action: 'approve', id: req.id })).status, 404);
    assert.equal((await applicant('/api/login', { email: APPLICANT.email, password: APPLICANT.password })).status, 200);
    assert.equal((await applicant('/api/session')).data.user.role, 'member');

    // Rejecting deletes the pending account; rejecting an active account is refused
    await anon('/api/signup', { name: 'Reject Me', email: 'reject@test.local', password: 'reject-password-123' });
    const rej = (await admin('/api/state')).data.requests.find(r => r.email === 'reject@test.local');
    assert.equal((await admin('/api/users', { action: 'reject', id: rej.id })).status, 200);
    assert.equal((await admin('/api/users', { action: 'reject', id: memberId })).status, 404);
    assert.equal((await anon('/api/login', { email: 'reject@test.local', password: 'reject-password-123' })).status, 401);

    const approvedId = (await applicant('/api/session')).data.user.id;
    assert.equal((await admin('/api/users', { action: 'remove', id: approvedId })).status, 200);
  });

  await t.test('members cannot perform admin actions', async () => {
    assert.equal((await member('/api/record', { kind: 'projects', body: { title: 'P' } })).status, 403);
    assert.equal((await member('/api/users', { name: 'x', email: 'y@test.local', password: 'yyyyyyyyyyyyyy' })).status, 403);
    assert.equal((await member('/api/delete', { id: 'anything' })).status, 404);
    assert.equal((await member('/api/timesheet', { action: 'delete', id: 'anything' })).status, 403);
  });

  await t.test('record validation and ownership', async () => {
    const p = await admin('/api/record', { kind: 'projects', body: { title: 'Website', owner: memberId } });
    assert.equal(p.status, 200);
    assert.equal((await admin('/api/record', { kind: 'tasks', body: { title: 'T', status: 'Bogus' } })).status, 400);
    assert.equal((await admin('/api/record', { kind: 'meetings', body: { title: 'M', start: '2026-01-01T10:00:00Z', end: '2026-01-01T11:00:00Z', link: 'javascript:alert(1)' } })).status, 400);
    const adminTask = await admin('/api/record', { kind: 'tasks', body: { title: 'Admin task', status: 'To do' } });
    const assigned = await admin('/api/record', { kind: 'tasks', body: { title: 'Assigned', status: 'To do', assignee: memberId } });
    assert.equal((await member('/api/record', { kind: 'tasks', id: adminTask.data.id, body: { title: 'Hijack', status: 'Done' } })).status, 403);
    assert.equal((await member('/api/record', { kind: 'tasks', id: assigned.data.id, body: { title: 'Assigned', status: 'Done', assignee: memberId } })).status, 200);
    const state = (await admin('/api/state')).data;
    assert.equal(state.projects[0].owner, state.users.find(u => u.role === 'admin').id, 'owner is set by the server');
    assert.equal(state.tasks.find(x => x.id === assigned.data.id).status, 'Done');
    assert.equal((await member('/api/delete', { id: p.data.id })).status, 403, 'members cannot delete projects');
  });

  await t.test('meetings queue an invitation that waits for Gmail setup', async () => {
    const r = await admin('/api/record', { kind: 'meetings', body: { title: 'Sync', start: '2026-01-01T10:00:00Z', end: '2026-01-01T11:00:00Z', attendees: [memberId] } });
    assert.equal(r.status, 200);
    assert.equal((await admin('/api/jobs/retry', {})).status, 200);
    const jobs = (await admin('/api/state')).data.jobs;
    assert.equal(jobs[0].kind, 'email');
    assert.equal(jobs[0].status, 'waiting');
  });

  await t.test('clock lifecycle allows one active session', async () => {
    assert.equal((await member('/api/clock', { action: 'break' })).status, 400);
    assert.equal((await member('/api/clock', { action: 'start' })).status, 200);
    assert.equal((await member('/api/clock', { action: 'start' })).status, 400);
    assert.equal((await member('/api/clock', { action: 'break' })).status, 200);
    assert.equal((await member('/api/clock', { action: 'break' })).status, 400);
    assert.equal((await member('/api/clock', { action: 'resume' })).status, 200);
    assert.equal((await member('/api/clock', { action: 'switch', project: 'proj-1', task: 'task-1', note: 'switched focus' })).status, 200);
    assert.equal((await member('/api/clock', { action: 'stop' })).status, 200);
    assert.equal((await member('/api/clock', { action: 'start' })).status, 200);
    const mine = (await member('/api/state')).data.clocks.filter(c => c.user_id === memberId);
    assert.equal(mine.length, 2);
    assert.equal(mine.filter(c => !c.end).length, 1);
  });

  await t.test('members delete only tasks, leads, and standups they created', async () => {
    const own = await member('/api/record', {
      kind: 'tasks',
      body: {
        title: 'Mine',
        status: 'To do',
        blocked: true,
        blockerNote: 'Waiting on API spec',
        subtasks: [{ id: 's1', title: 'Step 1', done: true }],
        comments: [{ id: 'c1', authorName: 'Test Member', text: 'Started work' }]
      }
    });
    assert.equal(own.status, 200);
    const standup = await member('/api/record', {
      kind: 'standups',
      body: { title: 'Shipping dashboard', yesterday: 'API tests', blockers: '', mood: 'Focused' }
    });
    assert.equal(standup.status, 200);
    assert.equal((await member('/api/record', { kind: 'goals', body: { title: 'Q4 Goal', currentValue: 10, targetValue: 100 } })).status, 403, 'only admins create company goals');
    const goal = await admin('/api/record', { kind: 'goals', body: { title: 'Q4 Goal', currentValue: 25, targetValue: 100, unit: '%' } });
    assert.equal(goal.status, 200);
    const adminTask = await admin('/api/record', { kind: 'tasks', body: { title: 'Admin only', status: 'To do', assignee: memberId } });
    assert.equal((await member('/api/delete', { id: adminTask.data.id })).status, 403, 'assigned is not enough to delete');
    assert.equal((await member('/api/delete', { id: own.data.id })).status, 200);
    assert.equal((await member('/api/delete', { id: standup.data.id })).status, 200);
    const stateAfter = (await admin('/api/state')).data;
    const tasks = stateAfter.tasks;
    assert.ok(!tasks.some(x => x.id === own.data.id));
    assert.ok(tasks.some(x => x.id === adminTask.data.id));
    assert.equal(stateAfter.goals.length, 1);
  });

  await t.test('admins correct time entries; members cannot', async () => {
    const running = (await admin('/api/state')).data.clocks.find(c => c.user_id === memberId && !c.end);
    assert.equal((await member('/api/timesheet', { action: 'stop', id: running.id })).status, 403);
    assert.equal((await admin('/api/timesheet', { action: 'stop', id: running.id })).status, 200);
    assert.equal((await admin('/api/timesheet', { action: 'stop', id: running.id })).status, 400);
    const now = Date.now() / 1000;
    assert.equal((await admin('/api/timesheet', { action: 'update', id: running.id, start: now - 3600, end: now - 7200 })).status, 400);
    assert.equal((await admin('/api/timesheet', { action: 'update', id: running.id, start: now - 7200, end: now + 86400 })).status, 400);
    assert.equal((await admin('/api/timesheet', { action: 'update', id: running.id, start: now - 7200, end: now - 3600, break_seconds: 600, note: 'fixed' })).status, 200);
    const fixed = (await admin('/api/state')).data.clocks.find(c => c.id === running.id);
    assert.equal(Math.round(fixed.end - fixed.start), 3600);
    assert.equal(fixed.note, 'fixed');
    assert.equal((await member('/api/clock', { action: 'start' })).status, 200, 'member can clock in again after admin clock-out');
    assert.equal((await member('/api/clock', { action: 'stop' })).status, 200);
    assert.equal((await admin('/api/timesheet', { action: 'delete', id: running.id })).status, 200);
    assert.ok(!(await admin('/api/state')).data.clocks.some(c => c.id === running.id));
  });

  await t.test('admin can correct a member name and email', async () => {
    assert.equal((await admin('/api/users', { action: 'update', id: memberId, email: ADMIN.email })).status, 409);
    assert.equal((await admin('/api/users', { action: 'update', id: memberId, name: 'Renamed Member', email: 'renamed@test.local' })).status, 200);
    const u = (await admin('/api/state')).data.users.find(x => x.id === memberId);
    assert.equal(u.name, 'Renamed Member');
    assert.equal(u.email, 'renamed@test.local');
    MEMBER.email = 'renamed@test.local';
  });

  await t.test('acknowledgements are idempotent', async () => {
    const a = await admin('/api/record', { kind: 'announcements', body: { title: 'Hello' } });
    await member('/api/ack', { id: a.data.id });
    await member('/api/ack', { id: a.data.id });
    const acks = (await admin('/api/state')).data.acknowledgements.filter(x => x.record_id === a.data.id);
    assert.equal(acks.length, 1);
  });

  await t.test('admin can reset a password, which signs the member out', async () => {
    assert.equal((await admin('/api/users', { action: 'update', id: memberId, password: 'brand-new-password-1' })).status, 200);
    assert.equal((await member('/api/state')).status, 401);
    assert.equal((await member('/api/login', { email: MEMBER.email, password: 'brand-new-password-1' })).status, 200);
  });

  await t.test('removing a member revokes access and closes their clock', async () => {
    const self = (await admin('/api/session')).data.user.id;
    assert.equal((await admin('/api/users', { action: 'remove', id: self })).status, 400);
    assert.equal((await admin('/api/users', { action: 'remove', id: memberId })).status, 200);
    assert.equal((await member('/api/state')).status, 401);
    const state = (await admin('/api/state')).data;
    assert.equal(state.users.length, 1);
    assert.ok(state.clocks.filter(c => c.user_id === memberId).every(c => c.end));
  });

  await t.test('password change signs out and requires the current password', async () => {
    assert.equal((await admin('/api/password', { current: 'nope-nope-nope', password: 'another-password-1' })).status, 400);
    assert.equal((await admin('/api/password', { current: ADMIN.password, password: 'another-password-1' })).status, 200);
    assert.equal((await admin('/api/state')).status, 401);
  });

  await t.test('login is throttled after repeated failures', async () => {
    let last;
    for (let i = 0; i < 16; i++) last = await anon('/api/login', { email: ADMIN.email, password: 'wrong-password-xx' });
    assert.equal(last.status, 429);
  });
});
