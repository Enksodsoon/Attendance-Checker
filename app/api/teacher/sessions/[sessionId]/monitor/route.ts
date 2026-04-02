import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { getTeacherMonitorData, isTeacherAssignedToSession } from '@/lib/services/app-data';

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const actor = await getSessionProfile();
  if (!actor || !['teacher', 'admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = await params;
  if (actor.role === 'teacher' && !isTeacherAssignedToSession(actor.profileId, sessionId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const monitor = getTeacherMonitorData(sessionId);
  if (!monitor) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(monitor);
}
