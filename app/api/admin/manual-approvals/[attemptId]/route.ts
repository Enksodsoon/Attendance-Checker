import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { resolveManualApprovalRequest } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  status: z.enum(['approved', 'rejected'])
});

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const actor = await getSessionProfile();
  if (!actor || !['teacher', 'admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { attemptId } = await params;
  const parsed = await readValidatedJson(request, schema);
  if (!parsed.success) {
    return parsed.response;
  }

  const payload = parsed.data;
  const item = resolveManualApprovalRequest({ attemptId, status: payload.status });

  if (!item) {
    return NextResponse.json({ error: 'ไม่พบคำขอที่ต้องการอัปเดต' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: `manual_approval_request.${payload.status}`,
    entityType: 'attendance_attempt',
    entityId: attemptId,
    metadata: payload
  });

  return NextResponse.json({ item });
}
