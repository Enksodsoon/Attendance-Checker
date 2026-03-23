import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { addAdminStudent, deleteAdminStudent, getAdminStudents, updateAdminStudent } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  studentCode: z.string().min(6).max(20),
  fullNameTh: z.string().min(2).max(120),
  facultyName: z.string().min(2).max(120),
  departmentName: z.string().min(2).max(120),
  yearLevel: z.coerce.number().int().min(1).max(8),
  email: z.string().email().optional().or(z.literal(''))
});

const updateSchema = schema.extend({
  studentId: z.string().min(1),
  status: z.enum(['active', 'inactive', 'suspended'])
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

  const parsed = await readValidatedJson(request, schema);
  if (!parsed.success) {
    return parsed.response;
  }

  const payload = parsed.data;
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

export async function PATCH(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await readValidatedJson(request, updateSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const payload = parsed.data;
  const student = updateAdminStudent(payload);
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'student.updated',
    entityType: 'student',
    entityId: student.studentId,
    metadata: payload
  });

  return NextResponse.json({ item: student });
}

export async function DELETE(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studentId = new URL(request.url).searchParams.get('studentId');
  if (!studentId) {
    return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
  }

  const student = deleteAdminStudent(studentId);
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'student.deleted',
    entityType: 'student',
    entityId: studentId,
    metadata: {}
  });

  return NextResponse.json({ item: student });
}
