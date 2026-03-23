import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { addAdminStudent, getAdminStudents } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  studentCode: z.string().min(6).max(20),
  fullNameTh: z.string().min(2).max(120),
  facultyName: z.string().min(2).max(120),
  departmentName: z.string().min(2).max(120),
  yearLevel: z.coerce.number().int().min(1).max(8),
  email: z.string().email().optional().or(z.literal(''))
});

export async function GET() {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ items: getAdminStudents() });
}

export async function POST(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = schema.parse(await request.json());
  const student = addAdminStudent(payload);

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'student.created',
    entityType: 'student',
    entityId: student.studentId,
    metadata: payload
  });

  return NextResponse.json({ item: student }, { status: 201 });
}
