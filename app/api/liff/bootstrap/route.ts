import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { getStudentDashboard } from '@/lib/services/db/student-attendance';

export async function GET() {
  const actor = await getSessionProfile();
  if (!actor || actor.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dashboard = await getStudentDashboard(actor.profileId);

  return NextResponse.json({
    student: dashboard.student,
    activeSessions: dashboard.activeSessions,
    summary: dashboard.summary
  });
}
