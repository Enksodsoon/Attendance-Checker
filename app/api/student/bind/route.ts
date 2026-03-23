import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStudentDashboard } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  studentCode: z.string().min(6).max(20),
  fullNameTh: z.string().min(2).max(120)
});

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());
  const dashboard = getStudentDashboard();

  if (payload.studentCode !== dashboard.student.studentCode) {
    return NextResponse.json({ error: 'ไม่พบรหัสนักศึกษาในข้อมูลระบบปัจจุบัน' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: dashboard.student.profileId,
    actionType: 'line_account.bound',
    entityType: 'profile',
    entityId: dashboard.student.profileId,
    metadata: payload
  });

  return NextResponse.json({
    status: 'success',
    profileId: dashboard.student.profileId,
    lineUserId: dashboard.student.lineUserId,
    studentCode: payload.studentCode,
    fullNameTh: payload.fullNameTh
  });
}
