import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { updateSessionStatus } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  status: z.enum(['open', 'closed'])
});

export async function PATCH(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const actor = await getSessionProfile();
  if (!actor || !['teacher', 'admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = await params;
  const payload = schema.parse(await request.json());
  const session = updateSessionStatus(sessionId, payload.status);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: `class_session.${payload.status}`,
    entityType: 'class_session',
    entityId: sessionId,
    metadata: payload
  });

  return NextResponse.json({ session });
}
