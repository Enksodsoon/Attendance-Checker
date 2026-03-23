import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { createEnrollment, deleteEnrollment, getAdminCourses, getAdminStudents, getEnrollments, getSectionOptions } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  studentId: z.string().min(1),
  sectionId: z.string().min(1)
});

export async function GET() {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    items: getEnrollments(),
    students: getAdminStudents(),
    sections: getSectionOptions(),
    courses: getAdminCourses()
  });
}

export async function POST(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = schema.parse(await request.json());
  const enrollment = createEnrollment(payload);

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'enrollment.created',
    entityType: 'enrollment',
    entityId: enrollment.enrollmentId,
    metadata: payload
  });

  return NextResponse.json({ item: enrollment }, { status: 201 });
}

export async function DELETE(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const enrollmentId = new URL(request.url).searchParams.get('enrollmentId');
  if (!enrollmentId) {
    return NextResponse.json({ error: 'Missing enrollmentId' }, { status: 400 });
  }

  const removed = deleteEnrollment(enrollmentId);
  if (!removed) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'enrollment.deleted',
    entityType: 'enrollment',
    entityId: enrollmentId,
    metadata: {}
  });

  return NextResponse.json({ item: removed });
}
