import { NextResponse } from 'next/server';
import { demoStudentDashboard } from '@/lib/services/demo-data';

export async function GET() {
  return NextResponse.json({
    student: demoStudentDashboard.student,
    activeSessions: demoStudentDashboard.activeSessions,
    summary: demoStudentDashboard.summary
  });
}
