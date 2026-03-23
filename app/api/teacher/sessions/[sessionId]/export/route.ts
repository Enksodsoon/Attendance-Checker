import { NextResponse } from 'next/server';
import { writeAuditLog } from '@/lib/services/audit-log';
import { demoTeacherMonitor } from '@/lib/services/demo-data';
import { toCsv } from '@/lib/utils/export';

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (sessionId !== demoTeacherMonitor.session.sessionId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: 'profile-teacher-1',
    actionType: 'attendance.export_csv',
    entityType: 'class_session',
    entityId: sessionId,
    metadata: { rowCount: demoTeacherMonitor.roster.length }
  });

  return new NextResponse(toCsv(demoTeacherMonitor.roster), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="attendance-${sessionId}.csv"`
    }
  });
}
