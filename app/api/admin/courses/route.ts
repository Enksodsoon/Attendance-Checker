import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { addAdminCourse, deleteAdminCourse, getAdminCourses, getRoomOptions, getTeacherOptions, updateAdminCourse } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  courseCode: z.string().min(2).max(20),
  courseNameTh: z.string().min(2).max(120),
  sectionCode: z.string().min(1).max(10),
  semesterLabel: z.string().min(2).max(60),
  teacherProfileId: z.string().min(1),
  roomId: z.string().min(1),
  sessionStatus: z.enum(['draft', 'open', 'closed']).optional()
});

const updateSchema = schema.extend({
  sectionId: z.string().min(1)
});

export async function GET() {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ items: getAdminCourses(), teacherOptions: getTeacherOptions(), roomOptions: getRoomOptions() });
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
  const session = addAdminCourse(payload);

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'course_section.created',
    entityType: 'course_section',
    entityId: session.sessionId,
    metadata: payload
  });

  return NextResponse.json({ item: session }, { status: 201 });
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
  const session = updateAdminCourse(payload);
  if (!session) {
    return NextResponse.json({ error: 'Course section not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'course_section.updated',
    entityType: 'course_section',
    entityId: payload.sectionId,
    metadata: payload
  });

  return NextResponse.json({ item: session });
}

export async function DELETE(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sectionId = new URL(request.url).searchParams.get('sectionId');
  if (!sectionId) {
    return NextResponse.json({ error: 'Missing sectionId' }, { status: 400 });
  }

  const section = deleteAdminCourse(sectionId);
  if (!section) {
    return NextResponse.json({ error: 'Course section not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'course_section.deleted',
    entityType: 'course_section',
    entityId: sectionId,
    metadata: {}
  });

  return NextResponse.json({ item: section });
}
