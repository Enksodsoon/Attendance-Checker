import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addAdminCourse, getAdminCourses } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  courseCode: z.string().min(2).max(20),
  courseNameTh: z.string().min(2).max(120),
  sectionCode: z.string().min(1).max(10),
  semesterLabel: z.string().min(2).max(60),
  teacherName: z.string().min(2).max(120),
  roomName: z.string().min(2).max(120),
  enrolledCount: z.coerce.number().int().min(1).max(500)
});

export async function GET() {
  return NextResponse.json({ items: getAdminCourses() });
}

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());
  const course = addAdminCourse(payload);

  await writeAuditLog({
    actorProfileId: 'profile-admin-01',
    actionType: 'course_section.created',
    entityType: 'course_section',
    entityId: course.sectionId,
    metadata: payload
  });

  return NextResponse.json({ item: course }, { status: 201 });
}
