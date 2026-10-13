import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSessionUser, HttpError, resetDatabaseCache } from './db';

export const COOKIE = 'syneolab';

export async function getAuthUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? getSessionUser(token) : null;
}

export function sessionCookie(response, token) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    // Secure whenever the site is served over HTTPS (Vercel/VPS); plain-HTTP local runs would otherwise drop the cookie.
    secure: (process.env.APP_URL || '').startsWith('https://') || process.env.VERCEL === '1',
    sameSite: 'lax',
    path: '/',
    maxAge: token ? 7 * 86400 : 0
  });
  return response;
}

export async function clientKey() {
  const h = await headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'local';
}

/** Rejects cross-site writes: the Origin must match the host serving the app (or APP_URL). */
async function assertSameOrigin() {
  const h = await headers();
  const origin = h.get('origin');
  if (!origin) return;
  const allowed = new Set([`https://${h.get('x-forwarded-host') || h.get('host')}`, `http://${h.get('host')}`]);
  if (process.env.APP_URL) allowed.add(process.env.APP_URL.replace(/\/$/, ''));
  if (!allowed.has(origin.replace(/\/$/, ''))) throw new HttpError(403, 'Origin is not allowed');
}

async function readJson(request) {
  const raw = await request.text();
  if (raw.length > 100000) throw new HttpError(413, 'Request too large');
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}

function isTransientMongoError(err) {
  const name = err?.name || '';
  const msg = err?.message || '';
  return (
    name.includes('MongoServerSelectionError') ||
    name.includes('MongoNetworkError') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT')
  );
}

/**
 * Wraps an API handler with origin checks, JSON parsing, authentication and error mapping.
 * options.auth: 'none' | 'user' | 'admin'
 */
export function api(handler, { auth = 'user' } = {}) {
  return async request => {
    const body = request.method === 'GET' ? null : await readJson(request).catch(err => ({ __parseError: err }));
    if (body?.__parseError) {
      const e = body.__parseError;
      return NextResponse.json({ error: e.message || 'Invalid JSON' }, { status: e.status || 400 });
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (request.method !== 'GET') await assertSameOrigin();
        let user = null;
        if (auth !== 'none') {
          user = await getAuthUser();
          if (!user) throw new HttpError(401, 'Please sign in');
          if (auth === 'admin' && user.role !== 'admin') throw new HttpError(403, 'Administrator access required');
        }
        const result = await handler({ request, body, user });
        if (result instanceof Response) return result;
        return NextResponse.json(result ?? { ok: true }, { headers: { 'Cache-Control': 'no-store' } });
      } catch (e) {
        if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
        if (isTransientMongoError(e) && attempt === 0) {
          resetDatabaseCache();
          continue;
        }
        console.error(e);
        return NextResponse.json({ error: 'The request could not be completed' }, { status: 500 });
      }
    }
  };
}
