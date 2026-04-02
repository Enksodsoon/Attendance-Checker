import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { createManualApprovalRequest } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  sessionId: z.string().min(1),
  attendanceAttemptId: z.string().min(1),
  reasonText: z.string().min(10).max(500)
});

export async function POST(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || actor.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await readValidatedJson(request, schema);
  if (!parsed.success) {
    return parsed.response;
  }

  const payload = parsed.data;
  const queueItem = createManualApprovalRequest({
    profileId: actor.profileId,
    ...payload
  });

  if (!queueItem) {
    return NextResponse.json({ error: 'ไม่พบ attendance attempt ที่สามารถส่งคำร้องได้' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
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
