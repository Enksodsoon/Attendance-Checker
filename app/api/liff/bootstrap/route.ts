import { NextResponse } from 'next/server';
import { getStudentDashboard } from '@/lib/services/app-data';

export async function GET() {
  const dashboard = getStudentDashboard();

  return NextResponse.json({
    student: dashboard.student,
    activeSessions: dashboard.activeSessions,
    summary: dashboard.summary
  });
}
