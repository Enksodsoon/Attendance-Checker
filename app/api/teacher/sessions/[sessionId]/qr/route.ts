import { NextResponse } from 'next/server';
import { generateQrToken } from '@/lib/utils/qr';
import { writeAuditLog } from '@/lib/services/audit-log';

export async function POST(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const token = generateQrToken();

  await writeAuditLog({
    actorProfileId: 'profile-teacher-1',
    actionType: 'session_qr_code.refreshed',
    entityType: 'class_session',
    entityId: sessionId,
    metadata: { tokenPreview: token.slice(0, 8) }
  });

  return NextResponse.json({ sessionId, token });
}
