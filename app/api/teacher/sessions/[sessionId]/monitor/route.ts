import { NextResponse } from 'next/server';
import { getActiveSessionId, getTeacherMonitorData } from '@/lib/services/app-data';

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (sessionId !== getActiveSessionId()) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(getTeacherMonitorData());
}
