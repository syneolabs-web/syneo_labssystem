/**
 * Syneolab data access layer (MongoDB Atlas).
 *
 * Collections:
 *   users, sessions, records (kind: projects|tasks|leads|meetings|announcements),
 *   clocks, acknowledgements, jobs, login_attempts, meta
 *
 * The client is cached on globalThis so serverless invocations on Vercel
 * reuse one connection pool per warm instance.
 */

import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import dns from 'dns';
import { promisify } from 'util';

// Ensure fast, reliable SRV DNS resolution for mongodb+srv:// even when local router DNS lags
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {}

const pbkdf2 = promisify(crypto.pbkdf2);
const PBKDF2_ITERATIONS = 210000;
const SESSION_DAYS = 7;
export const KINDS = ['projects', 'tasks', 'leads', 'meetings', 'announcements', 'standups', 'goals'];
const TASK_STATUSES = ['To do', 'In progress', 'In review', 'Done'];
const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const g = globalThis;

export function resetDatabaseCache() {
  // Only used if client is completely disconnected
}

async function database() {
  if (!g.__syneolab_db) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not configured');
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      retryReads: true,
      retryWrites: true
    });
    g.__syneolab_client = client;
    g.__syneolab_db = client.connect().then(async c => {
      const db = c.db(process.env.MONGODB_DB || 'syneolab');
      await ensureIndexes(db);
      return db;
    });
    // Allow a retry on the next request if the first connection fails.
    g.__syneolab_db.catch(() => {
      g.__syneolab_db = null;
      g.__syneolab_client = null;
    });
  }
  return g.__syneolab_db;
}

export async function closeDatabase() {
  if (g.__syneolab_client) {
    try {
      await g.__syneolab_client.close();
    } catch {
      // ignore
    }
    g.__syneolab_client = null;
    g.__syneolab_db = null;
  }
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('sessions').createIndex({ user_id: 1 }),
    db.collection('records').createIndex({ kind: 1, created: -1 }),
    // At most one daily check-in per member per day.
    db.collection('records').createIndex(
      { kind: 1, 'body.owner': 1, 'body.date': 1 },
      { unique: true, partialFilterExpression: { kind: 'standups', 'body.date': { $type: 'string' } }, name: 'one_daily_standup_per_member' }
    ),
    db.collection('clocks').createIndex({ start: -1 }),
    // At most one running clock per employee.
    db.collection('clocks').createIndex({ user_id: 1 }, { unique: true, partialFilterExpression: { active: true }, name: 'one_active_clock' }),
    db.collection('acknowledgements').createIndex({ record_id: 1, user_id: 1 }, { unique: true }),
    db.collection('jobs').createIndex({ status: 1, created: 1 }),
    db.collection('activity').createIndex({ created: -1 }),
    db.collection('login_attempts').createIndex({ at: 1 }, { expireAfterSeconds: 600 }),
    db.collection('login_attempts').createIndex({ key: 1 })
  ]);
}

const now = () => new Date().toISOString();
const uid = () => crypto.randomBytes(12).toString('hex');
const sha256 = v => crypto.createHash('sha256').update(v).digest('hex');
const str = (v, max = 5000) => (v == null ? '' : String(v)).slice(0, max);

const fmtDurationShort = sec => {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

const isEmployeeAssignedToProject = (projectBody = {}, userId = '') => {
  if (!userId || !projectBody) return false;
  return (
    projectBody.lead === userId ||
    projectBody.owner === userId ||
    (Array.isArray(projectBody.members) && projectBody.members.includes(userId))
  );
};

const isEmployeeAssignedToTask = (taskBody = {}, userId = '') => {
  if (!userId || !taskBody) return false;
  return (
    taskBody.owner === userId ||
    taskBody.assignee === userId ||
    (Array.isArray(taskBody.assignees) && taskBody.assignees.includes(userId))
  );
};

const isEmployeeAssignedToGoal = (goalBody = {}, userId = '') => {
  if (!userId || !goalBody) return false;
  const isTeamWide =
    goalBody.assignee === 'all' ||
    (!goalBody.assignee && (!Array.isArray(goalBody.assignees) || goalBody.assignees.length === 0));
  return (
    isTeamWide ||
    goalBody.owner === userId ||
    goalBody.assignee === userId ||
    (Array.isArray(goalBody.assignees) && goalBody.assignees.includes(userId))
  );
};

async function logActivity(db, entry = {}) {
  try {
    const col = db.collection('activity');
    const actorId = str(entry.actorId, 64);
    const action = str(entry.action || entry.type || 'updated', 60);
    const targetId = str(entry.targetId || '', 64);
    const targetUserId = str(entry.targetUserId || '', 64);
    const rawTargetUsers = Array.isArray(entry.targetUserIds) ? entry.targetUserIds : [];
    const targetUserIds = [...new Set([targetUserId, ...rawTargetUsers].map(x => str(x, 64)).filter(Boolean))].slice(0, 50);
    const ts = now();
    const docFields = {
      actorId,
      actorName: str(entry.actorName || 'Team member', 80),
      actorRole: str(entry.actorRole || 'member', 20),
      category: str(entry.category || 'general', 32),
      action,
      title: str(entry.title || entry.summary || 'Workspace activity', 220),
      detail: str(entry.detail || '', 450),
      targetId,
      targetUserId,
      targetUserIds,
      projectId: str(entry.projectId || '', 64),
      created: ts
    };
    if (entry.meta && typeof entry.meta === 'object' && Object.keys(entry.meta).length > 0) {
      docFields.meta = entry.meta;
    }

    // Single-roundtrip O(1) _id upsert: deduplicates rapid edits by the same actor on the same target within a 60s window (0 extra bytes)
    const isDedup = actorId && targetId && !['clock_in', 'clock_out', 'announcement_completed'].includes(action);
    const docId = isDedup ? `act_${actorId}_${targetId}_${action}_${Math.floor(Date.now() / 60000)}` : uid();
    await col.updateOne({ _id: docId }, { $set: docFields }, { upsert: true });

    // Non-blocking probabilistic cap so 'activity' never exceeds ~200 compact docs (<35KB total in 500MB free tier)
    if (Math.random() < 0.15) {
      col
        .find({}, { projection: { _id: 1 } })
        .sort({ created: -1 })
        .skip(200)
        .limit(100)
        .toArray()
        .then(stale => {
          if (stale.length > 0) {
            return col.deleteMany({ _id: { $in: stale.map(s => s._id) } });
          }
        })
        .catch(() => {});
    }
  } catch (err) {
    console.warn('Activity log skipped:', err.message);
  }
}

export function resolveAppUrl() {
  const raw = (process.env.APP_URL || '').trim().replace(/\/$/, '');
  if (raw && (!process.env.VERCEL || !raw.includes('localhost'))) return raw;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return raw;
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString('hex'), iterations = PBKDF2_ITERATIONS) {
  const hash = (await pbkdf2(password, salt, iterations, 32, 'sha256')).toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

async function checkPassword(password, stored) {
  if (typeof password !== 'string' || !stored) return false;
  const [, iterations, salt, hash] = stored.split('$');
  if (!hash) return false;
  const candidate = await hashPassword(password, salt, Number(iterations));
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(stored));
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 12) throw new HttpError(400, 'Use a password of at least 12 characters');
  if (password.length > 256) throw new HttpError(400, 'Password is too long');
}

function validEmail(email) {
  const clean = str(email, 254).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new HttpError(400, 'Enter a valid email address');
  return clean;
}

const VALID_ACCENTS = ['#4f46e5', '#145c40', '#285a80', '#644780', '#9b512d', '#b84b76', '#d4688e'];
const VALID_CURRENCIES = ['USD', 'NPR', 'INR', 'EUR', 'GBP'];
const VALID_WEEK_STARTS = ['Sunday', 'Monday'];

function parseMemberPositions(rawPositions, rawPositionStr, fallback = 'Team Member') {
  const rawList = [];
  if (Array.isArray(rawPositions)) {
    for (const item of rawPositions) {
      if (typeof item === 'string') {
        rawList.push(...item.split(/[,·]+/));
      }
    }
  }
  if (typeof rawPositionStr === 'string' && rawPositionStr.trim()) {
    rawList.push(...rawPositionStr.split(/[,·]+/));
  }
  const seen = new Set();
  const list = [];
  for (const raw of rawList) {
    const cleaned = str(raw, 50).trim();
    if (!cleaned) continue;
    const lower = cleaned.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    list.push(cleaned);
    if (list.length >= 10) break;
  }
  if (list.length === 0) {
    const fbList = String(fallback || 'Team Member')
      .split(/[,·]+/)
      .map(s => str(s, 50).trim())
      .filter(Boolean);
    const finalList = fbList.length ? fbList : ['Team Member'];
    return { positions: finalList, position: finalList.join(', ') };
  }
  return { positions: list, position: list.join(', ') };
}

export function isSuperAdmin(user) {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  return email === 'syneolabs@gmail.com' || user.role === 'super_admin' || user.isSuperAdmin === true;
}

export function isAdminRole(user) {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin' || isSuperAdmin(user);
}

export function cleanUser(u, viewerIsAdmin = true, viewerId = '') {
  if (!u) return null;
  const isSuper = isSuperAdmin(u);
  const actualRole = isSuper ? 'super_admin' : (u.role || 'member');
  const isSelfOrAdmin = viewerIsAdmin || !viewerId || u._id === viewerId;
  const parsed = parseMemberPositions(
    u.positions,
    u.position,
    isSelfOrAdmin && (actualRole === 'admin' || actualRole === 'super_admin') ? 'Founder, CEO' : 'Team Member'
  );
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: isSelfOrAdmin ? actualRole : 'member',
    isSuperAdmin: isSuper,
    department: u.department,
    position: parsed.position,
    positions: parsed.positions,
    preferences: isSelfOrAdmin ? u.preferences || {} : {}
  };
}

// --- Users & auth ---

export async function userCount() {
  const db = await database();
  return db.collection('users').countDocuments({}, { limit: 1 });
}

// Accounts created through "Request access" stay pending until an admin approves them.
// Older accounts have no status field and count as active.
const ACTIVE = { status: { $ne: 'pending' } };
const PENDING = { status: 'pending' };
export const DEFAULT_MEMBER_LIMIT = 20;
export const DEFAULT_DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Management'];
export const DEFAULT_POSITIONS = [
  'Founder',
  'CEO',
  'Co-Founder',
  'Marketing Head',
  'Analyst',
  'Engineering Lead',
  'Software Engineer',
  'Product Designer',
  'Project Manager',
  'Operations Lead'
];

function normalizeDepartments(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_DEPARTMENTS];
  const cleaned = [...new Set(raw.map(d => str(d, 40).trim()).filter(Boolean))].slice(0, 30);
  return cleaned.length > 0 ? cleaned : [...DEFAULT_DEPARTMENTS];
}

function normalizePositions(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_POSITIONS];
  const cleaned = [...new Set(raw.map(p => str(p, 50).trim()).filter(Boolean))].slice(0, 40);
  if (cleaned.length === 0) return [...DEFAULT_POSITIONS];
  if (!cleaned.some(p => p.toLowerCase() === 'founder')) {
    cleaned.unshift('Founder');
  }
  return cleaned.slice(0, 40);
}

export async function getWorkspaceDefaults() {
  const db = await database();
  const s = await db.collection('meta').findOne({ _id: 'settings' });
  return {
    defaultAccent: VALID_ACCENTS.includes(s?.defaultAccent) ? s.defaultAccent : '#4f46e5',
    defaultDarkMode: Boolean(s?.defaultDarkMode),
    defaultWeekStart: VALID_WEEK_STARTS.includes(s?.defaultWeekStart) ? s.defaultWeekStart : 'Sunday',
    defaultCurrency: VALID_CURRENCIES.includes(s?.defaultCurrency) ? s.defaultCurrency : 'USD',
    departments: normalizeDepartments(s?.departments),
    positions: normalizePositions(s?.positions)
  };
}

export async function getSettings() {
  const db = await database();
  const s = await db.collection('meta').findOne({ _id: 'settings' });
  return {
    memberLimit: s?.memberLimit ?? DEFAULT_MEMBER_LIMIT,
    defaultAccent: VALID_ACCENTS.includes(s?.defaultAccent) ? s.defaultAccent : '#4f46e5',
    defaultDarkMode: Boolean(s?.defaultDarkMode),
    defaultWeekStart: VALID_WEEK_STARTS.includes(s?.defaultWeekStart) ? s.defaultWeekStart : 'Sunday',
    defaultCurrency: VALID_CURRENCIES.includes(s?.defaultCurrency) ? s.defaultCurrency : 'USD',
    departments: normalizeDepartments(s?.departments),
    positions: normalizePositions(s?.positions)
  };
}

export async function manageDepartment(action, nameInput, actor = null) {
  const db = await database();
  const s = await db.collection('meta').findOne({ _id: 'settings' });
  const current = normalizeDepartments(s?.departments);
  const deptName = str(nameInput, 40).trim();
  if (!deptName || deptName.length < 2) {
    throw new HttpError(400, 'Department name must be between 2 and 40 characters');
  }
  let next = [...current];
  if (action === 'addDepartment') {
    if (current.some(d => d.toLowerCase() === deptName.toLowerCase())) {
      throw new HttpError(400, `Department “${deptName}” already exists`);
    }
    if (current.length >= 30) {
      throw new HttpError(400, 'Maximum of 30 departments reached');
    }
    next = [...current, deptName];
  } else if (action === 'removeDepartment') {
    next = current.filter(d => d.toLowerCase() !== deptName.toLowerCase());
    if (next.length === 0) {
      throw new HttpError(400, 'At least one department must remain in the workspace');
    }
  } else {
    throw new HttpError(400, 'Invalid department action');
  }

  await db.collection('meta').updateOne({ _id: 'settings' }, { $set: { departments: next } }, { upsert: true });
  if (actor) {
    await logActivity(db, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      category: 'settings',
      action: action === 'addDepartment' ? 'department_created' : 'department_removed',
      title: `${actor.name} ${action === 'addDepartment' ? 'created' : 'removed'} department “${deptName}”`,
      detail: `Active workspace departments (${next.length}): ${next.join(', ')}`,
      targetId: deptName
    });
  }
  return next;
}

export async function managePosition(action, nameInput, actor = null) {
  const db = await database();
  const s = await db.collection('meta').findOne({ _id: 'settings' });
  const current = normalizePositions(s?.positions);
  const posName = str(nameInput, 50).trim();
  if (!posName || posName.length < 2) {
    throw new HttpError(400, 'Position title must be between 2 and 50 characters');
  }
  let next = [...current];
  if (action === 'addPosition') {
    if (current.some(p => p.toLowerCase() === posName.toLowerCase())) {
      throw new HttpError(400, `Position “${posName}” already exists`);
    }
    if (current.length >= 40) {
      throw new HttpError(400, 'Maximum of 40 positions reached');
    }
    next = [...current, posName];
  } else if (action === 'removePosition') {
    next = current.filter(p => p.toLowerCase() !== posName.toLowerCase());
    if (next.length === 0) {
      throw new HttpError(400, 'At least one position must remain in the workspace');
    }
  } else {
    throw new HttpError(400, 'Invalid position action');
  }

  await db.collection('meta').updateOne({ _id: 'settings' }, { $set: { positions: next } }, { upsert: true });
  if (actor) {
    await logActivity(db, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      category: 'settings',
      action: action === 'addPosition' ? 'position_created' : 'position_removed',
      title: `${actor.name} ${action === 'addPosition' ? 'added' : 'removed'} position “${posName}”`,
      detail: `Active workspace positions (${next.length}): ${next.join(', ')}`,
      targetId: posName
    });
  }
  return next;
}

/**
 * Updates a user's personal preferences (accent, darkMode, weekStart, currency, lastSeenActivityAt).
 * - For Admins: also updates the Workspace Default theme/preferences enforced across the platform.
 * - For Employees (members): saves strictly to their own user account (never modifies the workspace default).
 */
export async function updateUserPreferences(actor, input = {}) {
  const db = await database();
  if (input.resetToDefault) {
    await db.collection('users').updateOne({ _id: actor.id }, { $set: { preferences: {} } });
    const defaults = await getWorkspaceDefaults();
    return { preferences: {}, workspaceDefaults: defaults };
  }

  const currentDoc = await db.collection('users').findOne({ _id: actor.id });
  const nextPrefs = { ...(currentDoc?.preferences || {}) };

  if (input.accent !== undefined) {
    if (!VALID_ACCENTS.includes(input.accent)) throw new HttpError(400, 'Invalid theme color');
    nextPrefs.accent = input.accent;
  }
  if (input.darkMode !== undefined) {
    nextPrefs.darkMode = Boolean(input.darkMode);
  }
  if (input.weekStart !== undefined) {
    if (!VALID_WEEK_STARTS.includes(input.weekStart)) throw new HttpError(400, 'Invalid week start day');
    nextPrefs.weekStart = input.weekStart;
  }
  if (input.currency !== undefined) {
    if (!VALID_CURRENCIES.includes(input.currency)) throw new HttpError(400, 'Invalid currency');
    nextPrefs.currency = input.currency;
  }
  if (input.lastSeenActivityAt !== undefined) {
    nextPrefs.lastSeenActivityAt = str(input.lastSeenActivityAt, 64);
  }

  await db.collection('users').updateOne({ _id: actor.id }, { $set: { preferences: nextPrefs } });

  // When an Admin updates visual preferences, also enforce them as the Workspace Default for the platform
  if (isAdminRole(actor) && input.setAsWorkspaceDefault !== false) {
    const metaUpdate = {};
    if (input.accent !== undefined && nextPrefs.accent) metaUpdate.defaultAccent = nextPrefs.accent;
    if (input.darkMode !== undefined) metaUpdate.defaultDarkMode = Boolean(nextPrefs.darkMode);
    if (input.weekStart !== undefined && nextPrefs.weekStart) metaUpdate.defaultWeekStart = nextPrefs.weekStart;
    if (input.currency !== undefined && nextPrefs.currency) metaUpdate.defaultCurrency = nextPrefs.currency;
    if (Object.keys(metaUpdate).length > 0) {
      await db.collection('meta').updateOne({ _id: 'settings' }, { $set: metaUpdate }, { upsert: true });
    }
  }

  const defaults = await getWorkspaceDefaults();
  return { preferences: nextPrefs, workspaceDefaults: defaults };
}

/** Team size limit: maximum number of accounts (admins + members, including pending requests). 0 closes sign-ups. */
export async function setMemberLimit(value) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 0 || limit > 10000) throw new HttpError(400, 'Enter a whole number between 0 and 10000');
  const db = await database();
  await db.collection('meta').updateOne({ _id: 'settings' }, { $set: { memberLimit: limit } }, { upsert: true });
}

async function seatUsage(db) {
  const [active, pending] = await Promise.all([
    db.collection('users').countDocuments(ACTIVE),
    db.collection('users').countDocuments(PENDING)
  ]);
  return { active, pending };
}

/** Whether the public "Request access" form accepts new requests. */
export async function signupOpen() {
  const db = await database();
  if (!(await userCount())) return false;
  const [{ memberLimit }, { active, pending }] = await Promise.all([getSettings(), seatUsage(db)]);
  return active + pending < memberLimit;
}

/** Employee self-registration: always a member, always pending until an admin approves. */
export async function requestAccess(payload) {
  const db = await database();
  if (!(await userCount())) throw new HttpError(409, 'This workspace has not been set up yet');
  if (!(await signupOpen())) throw new HttpError(403, 'Sign-ups are closed: this workspace has reached its team size limit. Please contact your administrator.');
  return insertUser(db, payload, 'member', 'pending');
}

export async function approveRequest(userId) {
  const db = await database();
  const target = await db.collection('users').findOne({ _id: str(userId, 64), ...PENDING });
  if (!target) throw new HttpError(404, 'This request no longer exists');
  const [{ memberLimit }, { active }] = await Promise.all([getSettings(), seatUsage(db)]);
  if (active >= memberLimit) throw new HttpError(409, `The team is full (${active} of ${memberLimit}). Raise the team size limit to approve more people.`);
  await db.collection('users').updateOne({ _id: target._id }, { $set: { status: 'active', approved: now() } });
}

export async function rejectRequest(userId) {
  const db = await database();
  const res = await db.collection('users').deleteOne({ _id: str(userId, 64), ...PENDING });
  if (!res.deletedCount) throw new HttpError(404, 'This request no longer exists');
}

async function insertUser(db, payload, role, status = 'active') {
  const name = str(payload?.name, 120).trim();
  if (!name) throw new HttpError(400, 'Name is required');
  if (!['admin', 'member', 'super_admin'].includes(role)) throw new HttpError(400, 'Invalid role');
  validatePassword(payload.password);
  const parsedPos = parseMemberPositions(
    payload.positions,
    payload.position,
    role === 'admin' || role === 'super_admin' ? 'Founder, CEO' : 'Team Member'
  );
  const user = {
    _id: uid(),
    name,
    email: validEmail(payload.email),
    password: await hashPassword(payload.password),
    role,
    department: str(payload.department, 80).trim() || 'Management',
    position: parsedPos.position,
    positions: parsedPos.positions,
    status,
    created: now()
  };
  try {
    await db.collection('users').insertOne(user);
  } catch (e) {
    if (e.code === 11000) throw new HttpError(409, 'This email is already registered');
    throw e;
  }
  return cleanUser(user);
}

/** First-run setup. A unique marker document makes this succeed exactly once. */
export async function setupWorkspace(payload) {
  const db = await database();
  if (await userCount()) throw new HttpError(409, 'Workspace already configured');
  try {
    await db.collection('meta').insertOne({ _id: 'setup', at: now() });
  } catch (e) {
    if (e.code === 11000) throw new HttpError(409, 'Workspace already configured');
    throw e;
  }
  try {
    return await insertUser(db, payload, 'admin');
  } catch (e) {
    await db.collection('meta').deleteOne({ _id: 'setup' });
    throw e;
  }
}

/** Admin "Add member": active immediately, but still within the team size limit. */
export async function createUser(payload, role, actor = null) {
  const db = await database();
  const [{ memberLimit }, { active }] = await Promise.all([getSettings(), seatUsage(db)]);
  if (active >= memberLimit) throw new HttpError(409, `The team is full (${active} of ${memberLimit}). Raise the team size limit first.`);
  const targetRole = role || 'member';
  if ((targetRole === 'admin' || targetRole === 'super_admin') && actor && !isSuperAdmin(actor)) {
    throw new HttpError(403, 'Only the Super Administrator can create administrator accounts');
  }
  return insertUser(db, payload, targetRole);
}

export async function verifyCredentials(email, password) {
  const db = await database();
  const u = await db.collection('users').findOne({ email: str(email, 254).trim().toLowerCase() });
  if (!u || !(await checkPassword(password, u.password))) return null;
  if (u.status === 'pending') throw new HttpError(403, 'Your access request is waiting for administrator approval.');
  return cleanUser(u);
}

export async function updatePassword(userId, newPassword) {
  validatePassword(newPassword);
  const db = await database();
  const res = await db.collection('users').updateOne({ _id: userId }, { $set: { password: await hashPassword(newPassword) } });
  if (!res.matchedCount) throw new HttpError(404, 'Account not found');
  await db.collection('sessions').deleteMany({ user_id: userId });
}

export async function updateMember(actor, userId, changes) {
  const db = await database();
  const target = await db.collection('users').findOne({ _id: str(userId, 64) });
  if (!target) throw new HttpError(404, 'Account not found');

  const targetIsSuper = isSuperAdmin(target);
  const targetIsAdmin = target.role === 'admin' || targetIsSuper;
  const actorIsSuper = isSuperAdmin(actor);

  // A regular admin cannot edit another administrator or the Super Admin
  if (targetIsAdmin && target._id !== actor.id && !actorIsSuper) {
    throw new HttpError(403, 'Only the Super Administrator can edit administrator accounts');
  }

  // Non-super admin cannot grant administrator privileges
  if (changes.role !== undefined) {
    if (!['admin', 'member', 'super_admin'].includes(changes.role)) throw new HttpError(400, 'Invalid role');
    if ((changes.role === 'admin' || changes.role === 'super_admin') && !actorIsSuper) {
      throw new HttpError(403, 'Only the Super Administrator can grant administrator privileges');
    }
    if (target._id === actor.id && changes.role !== 'admin' && changes.role !== 'super_admin') {
      throw new HttpError(400, 'You cannot remove your own administrator access');
    }
  }

  const set = {};
  if (changes.name !== undefined) set.name = str(changes.name, 120).trim() || target.name;
  if (changes.email !== undefined && str(changes.email).trim().toLowerCase() !== target.email) set.email = validEmail(changes.email);
  if (changes.department !== undefined) set.department = str(changes.department, 80).trim() || target.department;
  if (changes.positions !== undefined || changes.position !== undefined) {
    const parsedPos = parseMemberPositions(
      changes.positions,
      changes.position,
      target.position || (targetIsAdmin ? 'Founder, CEO' : 'Team Member')
    );
    set.position = parsedPos.position;
    set.positions = parsedPos.positions;
    // Sync any newly added custom positions into workspace settings
    const s = await db.collection('meta').findOne({ _id: 'settings' });
    const currentCatalog = normalizePositions(s?.positions);
    const catalogLower = new Set(currentCatalog.map(p => p.toLowerCase()));
    const added = parsedPos.positions.filter(p => !catalogLower.has(p.toLowerCase()));
    if (added.length > 0) {
      const nextCatalog = [...currentCatalog, ...added].slice(0, 40);
      await db.collection('meta').updateOne({ _id: 'settings' }, { $set: { positions: nextCatalog } }, { upsert: true });
    }
  }
  if (changes.role !== undefined) {
    set.role = changes.role;
  }
  if (Object.keys(set).length) {
    try {
      await db.collection('users').updateOne({ _id: target._id }, { $set: set });
    } catch (e) {
      if (e.code === 11000) throw new HttpError(409, 'This email is already registered');
      throw e;
    }
  }
  if (changes.password) await updatePassword(target._id, changes.password);
}

/** Removes an employee's login. Their past time entries and records remain for reporting. */
export async function removeUser(actor, userId) {
  const db = await database();
  if (userId === actor.id) throw new HttpError(400, 'You cannot remove your own account');
  const target = await db.collection('users').findOne({ _id: str(userId, 64) });
  if (!target) throw new HttpError(404, 'Account not found');

  if (isSuperAdmin(target)) {
    throw new HttpError(403, 'The Super Administrator account cannot be deleted');
  }

  const targetIsAdmin = target.role === 'admin' || target.role === 'super_admin' || isSuperAdmin(target);
  if (targetIsAdmin && !isSuperAdmin(actor)) {
    throw new HttpError(403, 'Administrators cannot delete other administrators. Only the Super Administrator can remove an admin.');
  }

  await db.collection('users').deleteOne({ _id: target._id });
  await db.collection('sessions').deleteMany({ user_id: target._id });
  await db.collection('clocks').updateMany(
    { user_id: target._id, active: true },
    { $set: { end: Date.now() / 1000, break_start: null }, $unset: { active: '' } }
  );
}

// --- Login throttling (shared across serverless instances) ---

export async function assertNotThrottled(key) {
  const db = await database();
  const since = new Date(Date.now() - 10 * 60 * 1000);
  const attempts = await db.collection('login_attempts').countDocuments({ key, at: { $gt: since } });
  if (attempts >= 15) throw new HttpError(429, 'Too many attempts. Try again in ten minutes.');
}

export async function recordFailedLogin(key) {
  const db = await database();
  await db.collection('login_attempts').insertOne({ key, at: new Date() });
}

// --- Sessions (only a SHA-256 of the token is stored) ---

export async function createSession(userId) {
  const db = await database();
  const token = crypto.randomBytes(32).toString('base64url');
  await db.collection('sessions').insertOne({
    _id: sha256(token),
    user_id: userId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86400 * 1000)
  });
  return token;
}

export async function getSessionUser(token) {
  if (!token) return null;
  const db = await database();
  const session = await db.collection('sessions').findOne({ _id: sha256(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return cleanUser(await db.collection('users').findOne({ _id: session.user_id, ...ACTIVE }));
}

export async function deleteSession(token) {
  const db = await database();
  await db.collection('sessions').deleteOne({ _id: sha256(token) });
}

// --- Workspace state & 24/7 Zero-Storage-Growth MongoDB Beacon ---

export async function pingDatabaseBeacon(source = 'auto') {
  const t0 = Date.now();
  const db = await database();
  const timestamp = now();

  // 1. Ping server + update a single fixed ~110-byte document in-place (0 bytes net storage growth forever)
  await Promise.all([
    db.command({ ping: 1 }),
    db.collection('meta').updateOne(
      { _id: 'beacon' },
      {
        $set: { lastPing: timestamp, lastSource: str(source, 40), status: 'awake' },
        $inc: { totalPings: 1 }
      },
      { upsert: true }
    ),
    // 2. Actively reclaim storage space by purging expired sessions & old login attempts
    db.collection('sessions').deleteMany({ expiresAt: { $lte: new Date() } }),
    db.collection('login_attempts').deleteMany({ at: { $lte: new Date(Date.now() - 600 * 1000) } })
  ]);

  // 3. Keep 'jobs' and 'activity' collections lean so 500MB DB never bloats
  const [oldSentJobs, oldActivities] = await Promise.all([
    db
      .collection('jobs')
      .find({ status: 'sent' }, { projection: { _id: 1 } })
      .sort({ created: -1 })
      .skip(30)
      .limit(100)
      .toArray(),
    db
      .collection('activity')
      .find({}, { projection: { _id: 1 } })
      .sort({ created: -1 })
      .skip(200)
      .limit(200)
      .toArray()
  ]);
  if (oldSentJobs.length > 0) {
    await db.collection('jobs').deleteMany({ _id: { $in: oldSentJobs.map(j => j._id) } });
  }
  if (oldActivities.length > 0) {
    await db.collection('activity').deleteMany({ _id: { $in: oldActivities.map(a => a._id) } });
  }

  const latencyMs = Date.now() - t0;
  const doc = await db.collection('meta').findOne({ _id: 'beacon' });
  return {
    ok: true,
    status: 'awake',
    lastPing: doc?.lastPing || timestamp,
    lastSource: doc?.lastSource || source,
    totalPings: doc?.totalPings || 1,
    latencyMs,
    netGrowthBytes: 0
  };
}

export function integrationStatus() {
  return {
    gmail: Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '')),
    sheets: Boolean(process.env.GOOGLE_SHEETS_URL?.trim() && process.env.GOOGLE_SHEETS_SECRET?.trim()),
    calendar: Boolean(process.env.GOOGLE_CALENDAR_URL?.trim())
  };
}

export async function getWorkspaceState(currentUser) {
  const db = await database();
  const isAdmin = isAdminRole(currentUser);
  const [records, users, clocks, acknowledgements, jobs, requests, settings, workspaceDefaults, beaconDoc, activities] = await Promise.all([
    db.collection('records').find({}).sort({ created: -1 }).toArray(),
    db.collection('users').find(ACTIVE, { projection: { password: 0 } }).sort({ name: 1 }).toArray(),
    db
      .collection('clocks')
      .find(isAdmin ? {} : { $or: [{ user_id: currentUser.id }, { active: true }] })
      .sort({ start: -1 })
      .limit(isAdmin ? 1000 : 350)
      .toArray(),
    db
      .collection('acknowledgements')
      .find(isAdmin ? {} : { user_id: currentUser.id }, { projection: { _id: 0 } })
      .toArray(),
    isAdmin ? db.collection('jobs').find({}, { projection: { body: 0 } }).sort({ created: -1 }).limit(30).toArray() : [],
    isAdmin ? db.collection('users').find(PENDING, { projection: { password: 0 } }).sort({ created: 1 }).toArray() : [],
    isAdmin ? getSettings() : null,
    getWorkspaceDefaults(),
    db.collection('meta').findOne({ _id: 'beacon' }),
    db
      .collection('activity')
      .find(
        isAdmin
          ? {}
          : {
              $or: [
                { actorId: currentUser.id },
                {
                  actorRole: 'admin',
                  $or: [
                    { targetUserId: currentUser.id },
                    { targetUserId: 'all' },
                    { targetUserIds: currentUser.id },
                    { targetUserIds: 'all' },
                    { category: 'announcements', action: { $ne: 'announcement_completed' } }
                  ]
                }
              ]
            }
      )
      .sort({ created: -1 })
      .limit(150)
      .toArray()
  ]);

  const state = Object.fromEntries(KINDS.map(k => [k, []]));

  // Pre-compute employee RBAC project & task scopes under strict least-privilege principle:
  const leadProjectIds = new Set();
  const assignedTaskProjectIds = new Set();
  if (!isAdmin) {
    for (const r of records) {
      if (r.kind === 'projects' && r.body?.lead === currentUser.id) {
        leadProjectIds.add(r._id);
      }
      if (r.kind === 'tasks' && isEmployeeAssignedToTask(r.body, currentUser.id) && r.body?.project) {
        assignedTaskProjectIds.add(r.body.project);
      }
    }
  }

  for (const r of records) {
    if (!state[r.kind]) continue;
    // Strict least-privilege record visibility for non-admin employees:
    if (!isAdmin) {
      if (r.kind === 'projects') {
        const canSeeProject =
          isEmployeeAssignedToProject(r.body, currentUser.id) ||
          assignedTaskProjectIds.has(r._id);
        if (!canSeeProject) continue;
        const { budget, ...publicProject } = r.body;
        state.projects.push({ ...publicProject, id: r._id, created: r.created });
        continue;
      }
      if (r.kind === 'tasks') {
        const canSeeTask =
          isEmployeeAssignedToTask(r.body, currentUser.id) ||
          (r.body?.project && leadProjectIds.has(r.body.project));
        if (!canSeeTask) continue;
      }
      if (r.kind === 'goals') {
        const canSeeGoal =
          isEmployeeAssignedToGoal(r.body, currentUser.id) ||
          (r.body?.project && leadProjectIds.has(r.body.project));
        if (!canSeeGoal) continue;
      }
      if (r.kind === 'leads' && r.body.owner !== currentUser.id && r.body.assignee !== currentUser.id) {
        continue;
      }
      if (
        r.kind === 'meetings' &&
        Array.isArray(r.body.attendees) &&
        r.body.attendees.length > 0 &&
        !r.body.attendees.includes(currentUser.id) &&
        r.body.owner !== currentUser.id
      ) {
        continue;
      }
    }
    state[r.kind].push({ ...r.body, id: r._id, created: r.created });
  }

  // Least-privilege timesheet visibility: employees get their own full history + redacted live presence for teammates
  const visibleClocks = isAdmin
    ? clocks.map(({ _id, active, ...c }) => ({ id: _id, ...c }))
    : clocks
        .filter(c => c.user_id === currentUser.id || !c.end)
        .map(({ _id, active, ...c }) =>
          c.user_id === currentUser.id
            ? { id: _id, ...c }
            : { id: _id, user_id: c.user_id, start: c.start, end: c.end, break_start: c.break_start, break_seconds: c.break_seconds || 0, project: '', note: '' }
        );

  return {
    ...state,
    users: users.map(u => cleanUser(u, isAdmin, currentUser.id)),
    clocks: visibleClocks,
    acknowledgements,
    integrations: integrationStatus(),
    jobs: jobs.map(({ _id, ...j }) => ({ id: _id, ...j })),
    requests: requests.map(u => ({ ...cleanUser(u, true), created: u.created })),
    settings,
    workspaceDefaults,
    activities: activities.map(({ _id, ...a }) => ({
      id: _id,
      ...a,
      type: a.action || a.type || 'activity',
      summary: a.title || a.summary || 'Workspace activity',
      createdAt: a.created || a.createdAt || ''
    })),
    beacon: {
      status: 'awake',
      lastPing: beaconDoc?.lastPing || now(),
      totalPings: beaconDoc?.totalPings || 1,
      netGrowthBytes: 0
    }
  };
}

// --- Records ---

function validateRecord(kind, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Invalid record');
  const body = {};
  const transientKeys = ['id', 'owner', 'created', 'notifyEmail', 'notifyEveryone', 'sendToEveryone', 'autoRoom'];
  for (const [k, v] of Object.entries(input)) {
    if (transientKeys.includes(k) || k.startsWith('$') || k.includes('.') || k.startsWith('_')) continue;
    if (Array.isArray(v)) {
      // Bound embedded arrays so documents stay compact on 500MB free tier
      const maxItems = k === 'comments' ? 50 : k === 'subtasks' ? 50 : k === 'milestones' ? 40 : 100;
      const sliced = k === 'comments' ? v.slice(-maxItems) : v.slice(0, maxItems);
      body[k] = sliced.map(x => {
        if (x && typeof x === 'object' && !Array.isArray(x)) {
          const cleanObj = {};
          for (const [ok, ov] of Object.entries(x)) {
            if (ok.startsWith('$') || ok.includes('.')) continue;
            cleanObj[ok] = typeof ov === 'boolean' || typeof ov === 'number' ? ov : str(ov, 600);
          }
          return cleanObj;
        }
        return str(x, 200);
      });
    } else if (typeof v === 'number' || typeof v === 'boolean') body[k] = v;
    else body[k] = str(v);
  }
  body.title = str(body.title, 200).trim();
  if (!body.title) throw new HttpError(400, 'A title is required');
  if (kind === 'tasks' && !TASK_STATUSES.includes(body.status)) throw new HttpError(400, 'Invalid task status');
  if (kind === 'leads' && !LEAD_STAGES.includes(body.stage)) throw new HttpError(400, 'Invalid lead stage');
  if (kind === 'meetings') {
    const start = Date.parse(body.start), end = Date.parse(body.end);
    if (Number.isNaN(start) || Number.isNaN(end)) throw new HttpError(400, 'Enter a valid meeting time');
    if (end <= start) throw new HttpError(400, 'Meeting end must follow its start');
    if (body.link && !/^https?:\/\//i.test(body.link)) throw new HttpError(400, 'Use a valid meeting URL');
  }
  if (kind === 'tasks' && body.deliverableUrl && !/^https?:\/\//i.test(body.deliverableUrl)) {
    throw new HttpError(400, 'Use a valid deliverable URL');
  }
  return body;
}

export async function generateGoogleMeetRoom(input = {}, currentUser) {
  if (!isAdminRole(currentUser)) throw new HttpError(403, 'Administrator access required');
  const calWebhook = (process.env.GOOGLE_CALENDAR_URL || '').trim();
  if (!calWebhook) {
    throw new HttpError(400, 'Google Calendar webhook is not configured in .env.local');
  }
  const secret = (process.env.GOOGLE_CALENDAR_SECRET || process.env.GOOGLE_SHEETS_SECRET || '').trim();
  const startIso = input.start && !Number.isNaN(Date.parse(input.start)) ? new Date(input.start).toISOString() : new Date(Date.now() + 3600000).toISOString();
  const endIso = input.end && !Number.isNaN(Date.parse(input.end)) ? new Date(input.end).toISOString() : new Date(Date.parse(startIso) + 1800000).toISOString();
  const res = await fetch(calWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      action: 'createMeeting',
      id: uid(),
      title: str(input.title || 'Syneolab Meeting', 200),
      start: startIso,
      end: endIso,
      description: str(input.description || '', 1500),
      location: 'Google Meet',
      attendees: []
    }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await res.json();
  if (!data?.ok || !data?.meetLink) {
    throw new HttpError(502, data?.error || 'Could not generate a Google Meet link from Google Calendar');
  }
  return { meetLink: data.meetLink, eventUrl: data.eventUrl || '' };
}

export async function saveRecord(kind, id, input, currentUser) {
  if (!KINDS.includes(kind)) throw new HttpError(400, 'Invalid collection');
  const isAdmin = isAdminRole(currentUser);
  if (!isAdmin && ['projects', 'meetings', 'announcements'].includes(kind)) throw new HttpError(403, 'Administrator access required');
  const wantEmail = isAdmin && Boolean(input?.notifyEmail && input.notifyEmail !== 'false');
  const wantEveryone = isAdmin && Boolean(
    (input?.notifyEveryone && input.notifyEveryone !== 'false') ||
    (input?.sendToEveryone && input.sendToEveryone !== 'false')
  );
  const wantAutoRoom = Boolean(input?.autoRoom && input.autoRoom !== 'false');
  const db = await database();
  const rid = id ? str(id, 64) : uid();
  const existing = await db.collection('records').findOne({ _id: rid });
  if (existing && existing.kind !== kind) throw new HttpError(400, 'Record collection cannot be changed');

  // If updating an existing task or goal, pre-fill existing fields so partial updates (e.g. progress bump or status change) succeed
  const mergedInput = existing && ['tasks', 'goals'].includes(kind)
    ? { ...existing.body, ...input, title: input?.title || existing.body.title }
    : input;
  const body = validateRecord(kind, mergedInput);

  const isCollaborator = Array.isArray(existing?.body?.assignees) && existing.body.assignees.includes(currentUser.id);
  const isTeamWideGoal =
    kind === 'goals' &&
    existing &&
    (!existing.body.assignee || existing.body.assignee === 'all') &&
    (!Array.isArray(existing.body.assignees) || existing.body.assignees.length === 0);
  if (
    !isAdmin &&
    existing &&
    existing.body.owner !== currentUser.id &&
    existing.body.assignee !== currentUser.id &&
    !isCollaborator &&
    !isTeamWideGoal
  ) {
    throw new HttpError(403, 'Least-privilege RBAC: This task was assigned by an administrator. Only assigned team members can update it.');
  }
  body.owner = existing ? existing.body.owner : currentUser.id;

  if (!isAdmin && kind === 'tasks') {
    if (!existing) {
      // Employee creating a personal task: must assign to self and attach strictly to an assigned project
      body.assignee = currentUser.id;
      body.assignees = [currentUser.id];
      if (!body.project) {
        throw new HttpError(400, 'Please select one of your assigned projects for this task');
      }
      const projDoc = await db.collection('records').findOne({ _id: str(body.project, 64), kind: 'projects' });
      const hasTaskInProj = await db
        .collection('records')
        .findOne({ _id: { $ne: rid }, kind: 'tasks', 'body.project': str(body.project, 64), $or: [{ 'body.assignee': currentUser.id }, { 'body.assignees': currentUser.id }] });
      if (!projDoc || (!isEmployeeAssignedToProject(projDoc.body, currentUser.id) && !hasTaskInProj)) {
        throw new HttpError(403, 'Least-privilege RBAC: You can only create tasks under projects assigned to you');
      }
    } else if (existing.body.owner !== currentUser.id) {
      // Employee updating an Admin-assigned task: lock structural/scope fields, allow only execution fields (status, blocker, deliverableUrl, subtasks, comments)
      body.title = existing.body.title;
      body.description = existing.body.description || '';
      body.project = existing.body.project || '';
      body.assignee = existing.body.assignee;
      body.assignees = existing.body.assignees || [existing.body.assignee];
      body.priority = existing.body.priority || 'Medium';
      body.due = existing.body.due || '';
      body.startDate = existing.body.startDate || existing.body.start_date || '';
      body.assigned_at = existing.body.assigned_at || '';
      body.department = existing.body.department || 'Engineering';
      body.estimateHours = existing.body.estimateHours || 0;
    } else {
      // Employee updating their own personal task: cannot reassign to others, and can only link to an assigned project
      body.assignee = currentUser.id;
      body.assignees = [currentUser.id];
      if (!body.project) {
        throw new HttpError(400, 'Please select one of your assigned projects for this task');
      }
      if (body.project !== existing.body.project) {
        const projDoc = await db.collection('records').findOne({ _id: str(body.project, 64), kind: 'projects' });
        const hasTaskInProj = await db
          .collection('records')
          .findOne({ _id: { $ne: rid }, kind: 'tasks', 'body.project': str(body.project, 64), $or: [{ 'body.assignee': currentUser.id }, { 'body.assignees': currentUser.id }] });
        if (!projDoc || (!isEmployeeAssignedToProject(projDoc.body, currentUser.id) && !hasTaskInProj)) {
          throw new HttpError(403, 'Least-privilege RBAC: You can only link tasks to projects assigned to you');
        }
      }
    }
  } else if (!isAdmin && kind === 'goals') {
    if (!existing) {
      // Employee creating a personal goal: strictly assign to self and validate any linked project
      body.assignee = currentUser.id;
      body.assignees = [currentUser.id];
      if (body.project) {
        const projDoc = await db.collection('records').findOne({ _id: str(body.project, 64), kind: 'projects' });
        const hasTaskInProj = await db
          .collection('records')
          .findOne({ _id: { $ne: rid }, kind: 'tasks', 'body.project': str(body.project, 64), $or: [{ 'body.assignee': currentUser.id }, { 'body.assignees': currentUser.id }] });
        if (!projDoc || (!isEmployeeAssignedToProject(projDoc.body, currentUser.id) && !hasTaskInProj)) {
          throw new HttpError(403, 'Least-privilege RBAC: You can only link goals to projects assigned to you');
        }
      }
    } else if (existing.body.owner !== currentUser.id) {
      // Employee updating an Admin-assigned goal: lock scope fields, allow progress, status, key results (subtasks), and comments
      body.title = existing.body.title;
      body.period = existing.body.period || 'weekly';
      body.category = existing.body.category || 'Company';
      body.due = existing.body.due || '';
      body.targetValue = Number(existing.body.targetValue ?? 100);
      body.unit = existing.body.unit || '%';
      body.assignee = existing.body.assignee || '';
      body.assignees = existing.body.assignees || [];
      body.project = existing.body.project || '';
    } else {
      // Employee updating their own personal goal: cannot reassign to other members
      body.assignee = currentUser.id;
      body.assignees = [currentUser.id];
      if (body.project && body.project !== existing.body.project) {
        const projDoc = await db.collection('records').findOne({ _id: str(body.project, 64), kind: 'projects' });
        const hasTaskInProj = await db
          .collection('records')
          .findOne({ _id: { $ne: rid }, kind: 'tasks', 'body.project': str(body.project, 64), $or: [{ 'body.assignee': currentUser.id }, { 'body.assignees': currentUser.id }] });
        if (!projDoc || (!isEmployeeAssignedToProject(projDoc.body, currentUser.id) && !hasTaskInProj)) {
          throw new HttpError(403, 'Least-privilege RBAC: You can only link goals to projects assigned to you');
        }
      }
    }
  } else if (!isAdmin && kind === 'leads') {
    body.assignee = existing && existing.body.owner !== currentUser.id ? existing.body.assignee : currentUser.id;
  }

  if (kind === 'tasks') {
    const rawTeam = Array.isArray(body.assignees) ? body.assignees : [];
    body.assignees = [...new Set([body.assignee, ...rawTeam].filter(Boolean))];
    if (body.assignee || body.assignees.length > 0) {
      body.assigned_at = existing?.body?.assigned_at || body.assigned_at || now();
    }
    // Track task start date and setable deadline
    body.startDate = str(body.startDate || body.start_date || existing?.body?.startDate || existing?.body?.start_date || (body.assigned_at ? body.assigned_at.slice(0, 10) : now().slice(0, 10)), 32);
    body.due = str(body.due || body.deadline || existing?.body?.due || existing?.body?.deadline || '', 32);
    if (body.status === 'Done') {
      body.completed_at = existing?.body?.completed_at || body.completed_at || now();
    } else {
      body.completed_at = null;
    }
  }
  if (kind === 'goals') {
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly'];
    const pLower = String(body.period || 'weekly').toLowerCase();
    body.period = validPeriods.includes(pLower) ? pLower : 'weekly';
    body.currentValue = Math.min(100, Math.max(0, Number(body.currentValue || 0)));
    body.targetValue = Math.max(1, Number(body.targetValue || 100));
    body.unit = str(body.unit || '%', 24).trim() || '%';
    const rawTeam = Array.isArray(body.assignees) ? body.assignees : [];
    body.assignees = [...new Set([body.assignee, ...rawTeam].filter(v => v && v !== 'all'))];
    const validStatuses = ['On track', 'At risk', 'Blocked', 'Completed'];
    if (body.currentValue >= body.targetValue) {
      body.status = 'Completed';
    } else if (!validStatuses.includes(body.status)) {
      body.status = 'On track';
    }
  }
  if (kind === 'projects') {
    const rawMembers = Array.isArray(body.members) ? body.members : [];
    body.members = [...new Set([body.lead, ...rawMembers].filter(Boolean))];
    // Track project start date and setable deadline
    body.startDate = str(body.startDate || body.start_date || existing?.body?.startDate || existing?.body?.start_date || now().slice(0, 10), 32);
    body.due = str(body.due || body.deadline || existing?.body?.due || existing?.body?.deadline || '', 32);
  }
  if (kind === 'standups') {
    const todayUtc = now().slice(0, 10);
    const clientDate = typeof input?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? input.date : null;
    const standupDate = clientDate || (existing?.body?.date) || (existing?.created ? existing.created.slice(0, 10) : todayUtc);
    body.date = standupDate;

    if (!existing) {
      // Enforce strictly one daily check-in per member across the workspace
      const existingToday = await db.collection('records').findOne({
        kind: 'standups',
        'body.owner': currentUser.id,
        $or: [
          { 'body.date': standupDate },
          { 'body.date': todayUtc },
          { created: { $regex: `^${todayUtc}` } },
          ...(clientDate ? [{ created: { $regex: `^${clientDate}` } }] : [])
        ]
      });
      if (existingToday) {
        throw new HttpError(400, 'You have already checked in today. Please edit your existing check-in instead of posting a duplicate.');
      }
    }
  }

  let meetingRecipients = [];
  if (kind === 'meetings') {
    const allActiveUsers = await db.collection('users').find(ACTIVE, { projection: { email: 1, name: 1 } }).toArray();
    if (wantEveryone) {
      body.attendees = allActiveUsers.map(u => u._id);
      meetingRecipients = allActiveUsers;
    } else {
      const selectedIds = new Set(body.attendees || []);
      meetingRecipients = allActiveUsers.filter(u => selectedIds.has(u._id));
    }

    // Parse optional comma-separated external guest emails
    const extraEmails = String(body.extraEmails || '')
      .split(/[,;\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    const allEmails = [...new Set([...meetingRecipients.map(u => u.email).filter(Boolean), ...extraEmails])];

    // Optional Google Calendar + Google Meet auto-creation webhook
    const calWebhook = (process.env.GOOGLE_CALENDAR_URL || '').trim();
    const alreadySyncedMeet = Boolean(body.link && body.link.includes('meet.google.com') && body.calendarEventUrl);
    if (calWebhook && !alreadySyncedMeet) {
      try {
        const secret = (process.env.GOOGLE_CALENDAR_SECRET || process.env.GOOGLE_SHEETS_SECRET || '').trim();
        const calRes = await fetch(calWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret,
            action: 'createMeeting',
            id: rid,
            title: body.title,
            start: body.start,
            end: body.end,
            description: body.description || '',
            location: body.location || 'Google Meet',
            attendees: allEmails
          }),
          signal: AbortSignal.timeout(12000)
        });
        const calData = await calRes.json();
        if (calData?.meetLink && (!body.link || (wantAutoRoom && body.link.includes('meet.jit.si')))) {
          body.link = calData.meetLink;
          if (!body.location || body.location === 'Online' || body.location === 'Video Room') {
            body.location = 'Google Meet';
          }
        }
        if (calData?.eventUrl) body.calendarEventUrl = calData.eventUrl;
      } catch (err) {
        console.warn('Google Calendar webhook skipped:', err.message);
      }
    }

    // Fallback instant Jitsi video room if user requested auto-room and no link was set
    if (!body.link && wantAutoRoom) {
      const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'sync';
      body.link = `https://meet.jit.si/Syneolab-${slug}-${rid.slice(0, 6)}`;
    }

    if (allEmails.length) {
      const appUrl = resolveAppUrl();
      await queueJob(db, 'email', {
        type: 'meeting',
        meetingId: rid,
        to: allEmails,
        organizerName: currentUser.name || 'Syneolab Workspace',
        organizerEmail: currentUser.email || process.env.GMAIL_USER || '',
        attendeeNames: meetingRecipients.map(u => u.name).filter(Boolean),
        title: body.title,
        start: body.start,
        end: body.end,
        location: body.location || 'Online',
        link: body.link || '',
        description: body.description || '',
        text: `${body.title}\nWhen: ${body.start} to ${body.end} (UTC)\nLocation: ${body.location || 'Online'}\nJoin: ${body.link || ''}\n\n${body.description || ''}${appUrl ? `\n\nWorkspace: ${appUrl}` : ''}`
      });
    }
  }

  const recordWritePromise = existing
    ? db.collection('records').updateOne({ _id: rid }, { $set: { body, updated: now() } })
    : db.collection('records').insertOne({ _id: rid, kind, body, created: now() }).catch(err => {
        if (err.code === 11000 && kind === 'standups') {
          throw new HttpError(400, 'You have already checked in today. Please edit your existing check-in instead of posting a duplicate.');
        }
        throw err;
      });

  // Record granular activity concurrently with the record write for minimum latency
  let activityPromise = Promise.resolve();
  if (kind === 'tasks') {
    const prev = existing?.body;
    let actType = existing ? 'task_updated' : 'task_created';
    let actTitle = existing ? `${currentUser.name} updated task “${body.title}”` : `${currentUser.name} created task “${body.title}”`;
    const details = [];
    if (!existing) {
      details.push(`Status: ${body.status || 'To do'} · Priority: ${body.priority || 'Medium'}`);
    } else {
      if (prev.status !== body.status) {
        actType = 'task_status';
        actTitle = `${currentUser.name} moved “${body.title}” (${prev.status} → ${body.status})`;
        details.push(`Status changed from ${prev.status} to ${body.status}`);
      }
      if (Boolean(prev.blocked) !== Boolean(body.blocked)) {
        actType = 'task_blocker';
        actTitle = body.blocked
          ? `${currentUser.name} flagged blocker on “${body.title}”`
          : `${currentUser.name} resolved blocker on “${body.title}”`;
        if (body.blocked && body.blockerNote) details.push(`Blocker: ${body.blockerNote}`);
      }
      const prevSubDone = (prev.subtasks || []).filter(s => s.done).length;
      const currSubDone = (body.subtasks || []).filter(s => s.done).length;
      if (currSubDone !== prevSubDone || (body.subtasks || []).length !== (prev.subtasks || []).length) {
        details.push(`Checklist: ${currSubDone}/${(body.subtasks || []).length} done`);
      }
      const prevComments = (prev.comments || []).length;
      const currComments = (body.comments || []).length;
      if (currComments > prevComments) {
        const latestComment = body.comments[currComments - 1];
        actType = 'task_comment';
        actTitle = `${currentUser.name} commented on “${body.title}”`;
        if (latestComment?.text) details.push(`“${latestComment.text}”`);
      }
    }
    activityPromise = logActivity(db, {
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'tasks',
      action: actType,
      title: actTitle,
      detail: details.join(' · ') || body.description || '',
      targetId: rid,
      targetUserId: body.assignee || '',
      targetUserIds: body.assignees || (body.assignee ? [body.assignee] : []),
      projectId: body.project || '',
      meta: { status: body.status, priority: body.priority, blocked: Boolean(body.blocked) }
    });
  } else if (kind === 'standups') {
    activityPromise = logActivity(db, {
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'standups',
      action: existing ? 'standup_updated' : 'standup_posted',
      title: existing
        ? `${currentUser.name} updated daily check-in: “${body.title}”`
        : `${currentUser.name} posted daily check-in: “${body.title}”`,
      detail: body.blockers ? `Blocker: ${body.blockers}` : body.yesterday || `Mood: ${body.mood || 'Focused'}`,
      targetId: rid,
      targetUserId: currentUser.id,
      targetUserIds: [currentUser.id],
      projectId: body.project || ''
    });
  } else if (kind === 'leads') {
    const prevStage = existing?.body?.stage;
    activityPromise = logActivity(db, {
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'leads',
      action: existing ? 'lead_updated' : 'lead_created',
      title: existing
        ? prevStage && prevStage !== body.stage
          ? `${currentUser.name} moved lead “${body.title}” (${prevStage} → ${body.stage})`
          : `${currentUser.name} updated lead “${body.title}”`
        : `${currentUser.name} captured new lead “${body.title}”`,
      detail: `${body.company ? body.company + ' · ' : ''}Stage: ${body.stage}`,
      targetId: rid,
      targetUserId: body.assignee || '',
      targetUserIds: body.assignee ? [body.assignee] : []
    });
  } else if (kind === 'projects') {
    activityPromise = logActivity(db, {
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'projects',
      action: existing ? 'project_updated' : 'project_created',
      title: `${currentUser.name} ${existing ? 'updated' : 'created'} project “${body.title}”`,
      detail: `Status: ${body.status || 'Active'} · Team members: ${(body.members || []).length}`,
      targetId: rid,
      targetUserId: body.lead || '',
      targetUserIds: body.members || (body.lead ? [body.lead] : []),
      projectId: rid
    });
  } else if (kind === 'announcements') {
    activityPromise = logActivity(db, {
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'announcements',
      action: existing ? 'announcement_updated' : 'announcement_posted',
      title: `${currentUser.name} ${existing ? 'updated' : 'posted'} announcement “${body.title}”`,
      detail: `${body.priority || 'Update'} · Team members can review & mark as complete`,
      targetId: rid,
      targetUserId: 'all',
      targetUserIds: ['all']
    });
  } else if (kind === 'goals') {
    const pct = Math.min(100, Math.round((Number(body.currentValue || 0) / Math.max(1, Number(body.targetValue || 100))) * 100));
    const periodLabel = String(body.period || 'weekly').charAt(0).toUpperCase() + String(body.period || 'weekly').slice(1);
    const prevPct = existing
      ? Math.min(100, Math.round((Number(existing.body?.currentValue || 0) / Math.max(1, Number(existing.body?.targetValue || 100))) * 100))
      : 0;
    const prevComments = (existing?.body?.comments || []).length;
    const currComments = (body.comments || []).length;
    let goalAction = existing ? 'goal_updated' : 'goal_created';
    let goalTitle = `${currentUser.name} ${existing ? 'updated' : 'set'} ${periodLabel.toLowerCase()} goal “${body.title}”`;
    if (existing && pct >= 100 && prevPct < 100) {
      goalAction = 'goal_completed';
      goalTitle = `🎯 ${currentUser.name} completed ${periodLabel.toLowerCase()} goal “${body.title}” (100%)`;
    } else if (existing && currComments > prevComments) {
      goalAction = 'goal_comment';
      goalTitle = `${currentUser.name} commented on goal “${body.title}”`;
    } else if (existing && pct !== prevPct) {
      goalAction = 'goal_progress';
      goalTitle = `${currentUser.name} updated progress on “${body.title}” (${prevPct}% → ${pct}%)`;
    }
    const subTotal = (body.subtasks || []).length;
    const subDone = (body.subtasks || []).filter(s => s.done).length;
    const goalTargetUsers =
      body.assignee === 'all'
        ? ['all']
        : Array.isArray(body.assignees) && body.assignees.length
        ? body.assignees
        : body.assignee
        ? [body.assignee]
        : ['all'];
    activityPromise = logActivity(db, {
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      category: 'goals',
      action: goalAction,
      title: goalTitle,
      detail: `${periodLabel} goal · ${body.currentValue}/${body.targetValue} ${body.unit || '%'} (${pct}%)${subTotal ? ` · Key results: ${subDone}/${subTotal}` : ''}`,
      targetId: rid,
      targetUserId: body.assignee || '',
      targetUserIds: goalTargetUsers,
      projectId: body.project || ''
    });
  }

  await Promise.all([recordWritePromise, activityPromise]);

  if (kind === 'leads') await queueJob(db, 'sheets', { id: rid });
  if (kind === 'tasks' && (wantEmail || wantEveryone)) {
    let to = [];
    if (wantEveryone) {
      const activeUsers = await db.collection('users').find(ACTIVE, { projection: { email: 1 } }).toArray();
      to = activeUsers.map(u => u.email).filter(Boolean);
    } else if (body.assignee || (body.assignees && body.assignees.length)) {
      const targetUserIds = [...new Set([body.assignee, ...(body.assignees || [])].filter(Boolean))];
      const assignees = await db.collection('users').find({ _id: { $in: targetUserIds }, ...ACTIVE }, { projection: { email: 1, name: 1 } }).toArray();
      to = assignees.map(a => a.email).filter(Boolean);
    }
    if (to.length) {
      const appUrl = resolveAppUrl();
      await queueJob(db, 'email', {
        type: 'task_assigned',
        to,
        title: `Task Assigned: ${body.title}`,
        priority: body.priority || 'Medium',
        status: body.status || 'To do',
        due: body.due || '',
        description: body.description || '',
        link: body.deliverableUrl || appUrl,
        text: `Task Assigned: ${body.title}\nPriority: ${body.priority || 'Medium'}\nStatus: ${body.status || 'To do'}${body.due ? `\nDue: ${body.due}` : ''}\n\n${body.description || ''}${appUrl ? `\n\nWorkspace: ${appUrl}` : ''}`
      });
    }
  }
  if (kind === 'announcements' && (wantEmail || wantEveryone)) {
    const activeUsers = await db.collection('users').find(ACTIVE, { projection: { email: 1 } }).toArray();
    const to = activeUsers.map(u => u.email).filter(Boolean);
    if (to.length) {
      const appUrl = resolveAppUrl();
      await queueJob(db, 'email', {
        type: 'announcement',
        to,
        title: `Announcement: ${body.title}`,
        priority: body.priority || 'Update',
        description: body.description || '',
        link: appUrl,
        text: `${body.title} (${body.priority || 'Update'})\n\n${body.description || ''}${appUrl ? `\n\nWorkspace: ${appUrl}` : ''}`
      });
    }
  }
  return rid;
}

/** Admins delete anything; members may delete tasks, leads, standups, and goals they created. */
export async function deleteRecord(id, currentUser) {
  const db = await database();
  const record = await db.collection('records').findOne({ _id: str(id, 64) });
  if (!record) throw new HttpError(404, 'This record no longer exists');
  if (!isAdminRole(currentUser) && !(['tasks', 'leads', 'standups', 'goals'].includes(record.kind) && record.body.owner === currentUser.id)) {
    throw new HttpError(403, 'You can only delete records you created');
  }
  await db.collection('records').deleteOne({ _id: str(id, 64) });
  await db.collection('acknowledgements').deleteMany({ record_id: str(id, 64) });
  await logActivity(db, {
    actorId: currentUser.id,
    actorName: currentUser.name,
    actorRole: currentUser.role,
    category: record.kind,
    action: 'record_deleted',
    title: `${currentUser.name} deleted ${record.kind.slice(0, -1)} “${record.body?.title || id}”`,
    detail: '',
    targetId: str(id, 64)
  });
}

export async function acknowledge(recordId, userOrId) {
  const db = await database();
  const rid = str(recordId, 64);
  const uidStr = typeof userOrId === 'string' ? userOrId : str(userOrId?.id, 64);
  if (!rid || !uidStr) throw new HttpError(400, 'Invalid announcement acknowledgement');

  const annDoc = await db.collection('records').findOne({ _id: rid, kind: 'announcements' });
  if (!annDoc) throw new HttpError(404, 'Announcement not found');

  const ackTime = now();
  const res = await db.collection('acknowledgements').updateOne(
    { record_id: rid, user_id: uidStr },
    { $setOnInsert: { record_id: rid, user_id: uidStr, at: ackTime } },
    { upsert: true }
  );

  // Immediately notify Admin & log participation when an employee marks an announcement as complete
  if (res.upsertedCount > 0) {
    let actorName = typeof userOrId === 'object' ? userOrId?.name : '';
    let actorRole = typeof userOrId === 'object' ? userOrId?.role : 'member';
    if (!actorName) {
      const uDoc = await db.collection('users').findOne({ _id: uidStr }, { projection: { name: 1, role: 1 } });
      actorName = uDoc?.name || 'Team member';
      actorRole = uDoc?.role || 'member';
    }
    const [ackCount, totalUsers] = await Promise.all([
      db.collection('acknowledgements').countDocuments({ record_id: rid }),
      db.collection('users').countDocuments(ACTIVE)
    ]);
    const pct = totalUsers > 0 ? Math.round((ackCount / totalUsers) * 100) : 100;
    await logActivity(db, {
      actorId: uidStr,
      actorName,
      actorRole,
      category: 'announcements',
      action: 'announcement_completed',
      title: `${actorName} marked announcement “${annDoc.body?.title || 'Update'}” as complete`,
      detail: `Participation: ${ackCount} of ${totalUsers} team members completed (${pct}%)`,
      targetId: rid
    });
  }
}

// --- Time clock ---

export async function clockAction(action, userId, payload = {}) {
  const db = await database();
  const clocks = db.collection('clocks');
  const actorDoc = await db.collection('users').findOne({ _id: userId }, { projection: { name: 1, role: 1 } });
  const actorName = actorDoc?.name || 'Team member';
  const actorRole = actorDoc?.role || 'member';
  const isAdmin = actorRole === 'admin' || actorRole === 'super_admin' || isSuperAdmin(actorDoc);
  const t = Date.now() / 1000;
  if (action === 'start') {
    const projId = str(payload.project, 64);
    const taskId = str(payload.task, 64);
    const startNote = str(payload.note, 1000).trim();
    const [projDoc, taskDoc] = await Promise.all([
      projId ? db.collection('records').findOne({ _id: projId, kind: 'projects' }) : null,
      taskId ? db.collection('records').findOne({ _id: taskId, kind: 'tasks' }) : null
    ]);
    if (!isAdmin) {
      if (projId) {
        const hasTaskInProj = await db
          .collection('records')
          .findOne({ kind: 'tasks', 'body.project': projId, $or: [{ 'body.assignee': userId }, { 'body.assignees': userId }] });
        if (!projDoc || (!isEmployeeAssignedToProject(projDoc.body, userId) && !hasTaskInProj)) {
          throw new HttpError(403, 'Least-privilege RBAC: You can only clock in on projects assigned to you');
        }
      }
      if (taskId && (!taskDoc || !isEmployeeAssignedToTask(taskDoc.body, userId))) {
        throw new HttpError(403, 'Least-privilege RBAC: You can only clock in on tasks assigned to you');
      }
    }
    const clockId = uid();
    try {
      await clocks.insertOne({
        _id: clockId, user_id: userId, project: projId, task: taskId,
        start: t, end: null, break_start: null, break_seconds: 0, note: startNote, active: true
      });
    } catch (e) {
      if (e.code === 11000) throw new HttpError(400, 'You are already clocked in');
      throw e;
    }
    await logActivity(db, {
      actorId: userId,
      actorName,
      actorRole,
      category: 'clock',
      action: 'clock_in',
      title: `${actorName} clocked in${projDoc?.body?.title ? ` on ${projDoc.body.title}` : ''}`,
      detail: [taskDoc?.body?.title ? `Task: ${taskDoc.body.title}` : '', startNote ? `Focus: ${startNote}` : ''].filter(Boolean).join(' · ') || 'Started shift',
      targetId: clockId,
      projectId: projId
    });
    return;
  }
  const active = await clocks.findOne({ user_id: userId, active: true });
  if (!active) throw new HttpError(400, 'Clock in first');
  if (action === 'break') {
    const res = await clocks.updateOne({ _id: active._id, break_start: null }, { $set: { break_start: t } });
    if (!res.modifiedCount) throw new HttpError(400, 'Break already running');
    await logActivity(db, {
      actorId: userId,
      actorName,
      actorRole,
      category: 'clock',
      action: 'clock_break',
      title: `${actorName} started a break`,
      detail: active.note ? `Current session: ${active.note}` : '',
      targetId: active._id,
      projectId: active.project || ''
    });
  } else if (action === 'switch') {
    const updates = {};
    if (payload.project !== undefined) updates.project = str(payload.project, 64);
    if (payload.task !== undefined) updates.task = str(payload.task, 64);
    if (payload.note !== undefined) updates.note = str(payload.note, 1000);
    await clocks.updateOne({ _id: active._id, active: true }, { $set: updates });
  } else if (action === 'resume' || action === 'stop') {
    const extra = active.break_start ? Math.max(0, t - active.break_start) : 0;
    if (action === 'resume' && !active.break_start) throw new HttpError(400, 'Not on a break');
    const update = { $inc: { break_seconds: extra }, $set: { break_start: null } };
    if (action === 'stop') {
      const submittedNote = payload.note !== undefined ? str(payload.note, 1000).trim() : '';
      if (!submittedNote || submittedNote.length < 3) {
        throw new HttpError(400, 'Please enter a work summary note before clocking out so the administrator can track your work.');
      }
      update.$set.end = t;
      update.$set.note = submittedNote;
      if (payload.project !== undefined) update.$set.project = str(payload.project, 64);
      if (payload.task !== undefined) update.$set.task = str(payload.task, 64);
      update.$unset = { active: '' };
      await clocks.updateOne({ _id: active._id, active: true }, update);

      const totalBreakSec = Math.max(0, (active.break_seconds || 0) + extra);
      const totalWorkedSec = Math.max(0, t - active.start - totalBreakSec);
      const finalProjId = payload.project !== undefined ? str(payload.project, 64) : active.project;
      const finalTaskId = payload.task !== undefined ? str(payload.task, 64) : active.task;
      const [projDoc, taskDoc] = await Promise.all([
        finalProjId ? db.collection('records').findOne({ _id: finalProjId, kind: 'projects' }) : null,
        finalTaskId ? db.collection('records').findOne({ _id: finalTaskId, kind: 'tasks' }) : null
      ]);
      await logActivity(db, {
        actorId: userId,
        actorName,
        actorRole,
        category: 'clock',
        action: 'clock_out',
        title: `${actorName} clocked out (${fmtDurationShort(totalWorkedSec)} worked)`,
        detail: `Work note: “${submittedNote}”${projDoc?.body?.title ? ` · Project: ${projDoc.body.title}` : ''}${taskDoc?.body?.title ? ` · Task: ${taskDoc.body.title}` : ''}`,
        targetId: active._id,
        projectId: finalProjId || '',
        meta: {
          workedSeconds: Math.round(totalWorkedSec),
          breakSeconds: Math.round(totalBreakSec),
          note: submittedNote,
          projectTitle: projDoc?.body?.title || '',
          taskTitle: taskDoc?.body?.title || ''
        }
      });
    } else {
      await clocks.updateOne({ _id: active._id, active: true }, update);
      await logActivity(db, {
        actorId: userId,
        actorName,
        actorRole,
        category: 'clock',
        action: 'clock_resume',
        title: `${actorName} resumed work from break`,
        detail: `Break duration: ${fmtDurationShort(extra)}`,
        targetId: active._id,
        projectId: active.project || ''
      });
    }
  } else {
    throw new HttpError(400, 'Invalid clock action');
  }
}

/** Admin corrections to anyone's time entries: stop a forgotten clock, fix times, or delete an entry. */
export async function manageTimeEntry(action, id, changes = {}) {
  const db = await database();
  const clocks = db.collection('clocks');
  const entry = await clocks.findOne({ _id: str(id, 64) });
  if (!entry) throw new HttpError(404, 'Time entry not found');
  if (action === 'delete') {
    await clocks.deleteOne({ _id: entry._id });
  } else if (action === 'stop') {
    if (!entry.active) throw new HttpError(400, 'This session has already ended');
    const t = Date.now() / 1000;
    const extra = entry.break_start ? Math.max(0, t - entry.break_start) : 0;
    await clocks.updateOne({ _id: entry._id }, { $inc: { break_seconds: extra }, $set: { end: t, break_start: null }, $unset: { active: '' } });
  } else if (action === 'update') {
    const start = Number(changes.start), end = Number(changes.end);
    const breakSeconds = Math.max(0, Number(changes.break_seconds) || 0);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new HttpError(400, 'Clock-out must be after clock-in');
    if (end > Date.now() / 1000 + 60) throw new HttpError(400, 'Clock-out cannot be in the future');
    if (breakSeconds >= end - start) throw new HttpError(400, 'Break time must be shorter than the session');
    await clocks.updateOne(
      { _id: entry._id },
      { $set: { start, end, break_seconds: breakSeconds, break_start: null, note: str(changes.note ?? entry.note, 1000), project: str(changes.project ?? entry.project, 64), task: str(changes.task ?? entry.task, 64) }, $unset: { active: '' } }
    );
  } else {
    throw new HttpError(400, 'Invalid action');
  }
}

// --- Outbound delivery queue (Gmail, Google Sheets) ---

async function queueJob(db, kind, body) {
  await db.collection('jobs').insertOne({ _id: uid(), kind, body, status: 'pending', attempts: 0, error: '', created: now() });
}

export async function pendingJobs(limit = 10) {
  const db = await database();
  return db.collection('jobs').find({ status: 'pending', attempts: { $lt: 3 } }).sort({ created: 1 }).limit(limit).toArray();
}

export async function finishJob(id, status, error = '') {
  const db = await database();
  await db.collection('jobs').updateOne({ _id: id }, { $set: { status, error }, $inc: { attempts: 1 } });
}

export async function getLead(id) {
  const db = await database();
  const r = await db.collection('records').findOne({ _id: id, kind: 'leads' });
  return r ? { ...r.body, id: r._id } : null;
}

export async function retryJobs() {
  const db = await database();
  await db.collection('jobs').updateMany({ status: { $in: ['failed', 'waiting'] } }, { $set: { status: 'pending', attempts: 0, error: '' } });
}
