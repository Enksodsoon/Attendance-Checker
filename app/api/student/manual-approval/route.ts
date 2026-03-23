import { NextResponse } from 'next/server';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  sessionId: z.string().min(1),
  attendanceAttemptId: z.string().min(1),
  reasonText: z.string().min(10).max(500)
});

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());

  await writeAuditLog({
    actorProfileId: 'profile-student-1',
    actionType: 'manual_approval_request.created',
    entityType: 'class_session',
    entityId: payload.sessionId,
    metadata: payload
  });

  return NextResponse.json({
    status: 'pending',
    ...payload
  });
}
