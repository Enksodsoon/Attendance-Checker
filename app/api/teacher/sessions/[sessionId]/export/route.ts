import { NextResponse } from 'next/server';
import { getActiveSessionId, getTeacherMonitorData } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';
import { toCsv } from '@/lib/utils/export';

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (sessionId !== getActiveSessionId()) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const monitor = getTeacherMonitorData();

  await writeAuditLog({
    actorProfileId: 'profile-teacher-01',
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
