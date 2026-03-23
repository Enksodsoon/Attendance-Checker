import { NextResponse } from 'next/server';
import { z } from 'zod';
import { writeAuditLog } from '@/lib/services/audit-log';
import { demoStudentDashboard } from '@/lib/services/demo-data';

const schema = z.object({
  studentCode: z.string().min(6).max(20),
  fullNameTh: z.string().min(2).max(120)
});

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());

  if (payload.studentCode !== demoStudentDashboard.student.studentCode) {
    return NextResponse.json({ error: 'ไม่พบรหัสนักศึกษาในข้อมูลตัวอย่าง' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: demoStudentDashboard.student.profileId,
    actionType: 'line_account.bound',
    entityType: 'profile',
    entityId: demoStudentDashboard.student.profileId,
    metadata: payload
  });

  return NextResponse.json({
    status: 'success',
    profileId: demoStudentDashboard.student.profileId,
    lineUserId: demoStudentDashboard.student.lineUserId,
    studentCode: payload.studentCode,
    fullNameTh: payload.fullNameTh
  });
}
