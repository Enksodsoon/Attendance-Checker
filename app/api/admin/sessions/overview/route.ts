import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { getSessionOverview } from '@/lib/services/app-data';

export async function GET(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin', 'teacher'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = new URL(request.url).searchParams.get('sessionId') ?? undefined;
  const overview = getSessionOverview(sessionId);
  if (!overview) {
    return NextResponse.json({ error: 'No active session' }, { status: 404 });
  }

  return NextResponse.json(overview);
}
