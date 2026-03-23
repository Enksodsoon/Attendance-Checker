import { NextResponse } from 'next/server';
import { getActiveSessionId, refreshCurrentQrToken } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

export async function POST(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  if (sessionId !== getActiveSessionId()) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const token = refreshCurrentQrToken(sessionId);
  if (!token) {
    return NextResponse.json({ error: 'Unable to refresh token' }, { status: 400 });
  }

  await writeAuditLog({
    actorProfileId: 'profile-teacher-01',
    actionType: 'session_qr_code.refreshed',
    entityType: 'class_session',
    entityId: sessionId,
    metadata: { tokenPreview: token.slice(0, 8) }
  });

  return NextResponse.json({ sessionId, token });
}
