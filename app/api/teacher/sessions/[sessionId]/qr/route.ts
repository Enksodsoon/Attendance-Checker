import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { isTeacherAssignedToSession, refreshCurrentQrToken } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

export async function POST(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const actor = await getSessionProfile();
  if (!actor || !['teacher', 'admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = await params;
  if (actor.role === 'teacher' && !isTeacherAssignedToSession(actor.profileId, sessionId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = refreshCurrentQrToken(sessionId);
  if (!token) {
    return NextResponse.json({ error: 'Unable to refresh token' }, { status: 400 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'session_qr_code.refreshed',
    entityType: 'class_session',
    entityId: sessionId,
    metadata: { tokenPreview: token.slice(0, 8) }
  });

  return NextResponse.json({ sessionId, token });
}
