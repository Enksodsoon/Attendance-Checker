import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { bindStudentIdentity } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  studentCode: z.string().min(6).max(20),
  fullNameTh: z.string().min(2).max(120)
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
  const student = bindStudentIdentity(actor.profileId, {
    ...payload,
    lineUserId: actor.lineUserId
  });

  if (!student) {
    return NextResponse.json({ error: 'ไม่พบรหัสนักศึกษาที่ตรงกับบัญชีปัจจุบัน' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'line_account.bound',
    entityType: 'profile',
    entityId: actor.profileId,
    metadata: payload
  });

  return NextResponse.json({
    status: 'success',
    profileId: actor.profileId,
    lineUserId: student.lineUserId,
    studentCode: payload.studentCode,
    fullNameTh: payload.fullNameTh
  });
}
