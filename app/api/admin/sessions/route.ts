import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { addAdminSession, deleteAdminSession, getAdminSessions, getSectionOptions, updateAdminSession } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';
import { readValidatedJson } from '@/lib/utils/api';

const windowSchema = z.object({
  scheduledStartAt: z.string().datetime(),
  scheduledEndAt: z.string().datetime(),
  attendanceOpenAt: z.string().datetime(),
  lateAfterAt: z.string().datetime(),
  attendanceCloseAt: z.string().datetime()
});

const schema = z.object({
  sectionId: z.string().min(1),
  status: z.enum(['draft', 'open', 'closed', 'cancelled']),
  allowManualApproval: z.boolean(),
  window: windowSchema
});

const updateSchema = schema.extend({
  sessionId: z.string().min(1)
});

export async function GET() {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    items: getAdminSessions(),
    sectionOptions: getSectionOptions()
  });
}

export async function POST(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await readValidatedJson(request, schema);
  if (!parsed.success) {
    return parsed.response;
  }

  const session = addAdminSession(parsed.data);
  if (!session) {
    return NextResponse.json({ error: 'Section not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'class_session.created',
    entityType: 'class_session',
    entityId: session.sessionId,
    metadata: parsed.data
  });

  return NextResponse.json({ item: session }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await readValidatedJson(request, updateSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const session = updateAdminSession(parsed.data);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'class_session.updated',
    entityType: 'class_session',
    entityId: session.sessionId,
    metadata: parsed.data
  });

  return NextResponse.json({ item: session });
}

export async function DELETE(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = new URL(request.url).searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const session = deleteAdminSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'class_session.deleted',
    entityType: 'class_session',
    entityId: sessionId,
    metadata: {}
  });

  return NextResponse.json({ item: session });
}
