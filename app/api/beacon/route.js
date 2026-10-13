import { NextResponse } from 'next/server';
import { pingDatabaseBeacon, resetDatabaseCache } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function handleBeacon(request, defaultSource) {
  const url = new URL(request.url);
  const source = url.searchParams.get('source') || defaultSource;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await pingDatabaseBeacon(source);
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    } catch (e) {
      if (attempt === 0) {
        resetDatabaseCache();
        continue;
      }
      console.error('MongoDB beacon error:', e);
      return NextResponse.json({ ok: false, status: 'reconnecting', error: 'Beacon retry scheduled' }, { status: 503 });
    }
  }
}

export async function GET(request) {
  const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron');
  return handleBeacon(request, isVercelCron ? 'vercel-cron' : 'keepalive-get');
}

export async function POST(request) {
  return handleBeacon(request, 'client-beacon');
}
