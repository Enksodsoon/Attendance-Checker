import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createManualApprovalRequest, getStudentDashboard } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  sessionId: z.string().min(1),
  attendanceAttemptId: z.string().min(1),
  reasonText: z.string().min(10).max(500)
});

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());
  const queueItem = createManualApprovalRequest(payload);

  if (!queueItem) {
    return NextResponse.json({ error: 'ไม่พบ attendance attempt ที่สามารถส่งคำร้องได้' }, { status: 404 });
  }

  const dashboard = getStudentDashboard();

  await writeAuditLog({
    actorProfileId: dashboard.student.profileId,
    actionType: 'manual_approval_request.created',
    entityType: 'class_session',
    entityId: payload.sessionId,
    metadata: payload
  });

  return NextResponse.json({
    status: queueItem.status,
    queueItem
  });
}
