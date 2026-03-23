import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { getTeacherMonitorData, isTeacherAssignedToSession } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';
import { toCsv } from '@/lib/utils/export';

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

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'attendance.export_csv',
    entityType: 'class_session',
    entityId: sessionId,
    metadata: { rowCount: monitor.roster.length }
  });

  return new NextResponse(toCsv(monitor.roster), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="attendance-${sessionId}.csv"`
    }
  });
}
