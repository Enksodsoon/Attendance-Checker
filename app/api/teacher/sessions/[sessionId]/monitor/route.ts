import { NextResponse } from 'next/server';
import { demoTeacherMonitor } from '@/lib/services/demo-data';

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (sessionId !== demoTeacherMonitor.session.sessionId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(demoTeacherMonitor);
}
