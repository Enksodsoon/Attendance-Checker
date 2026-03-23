import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { addAdminUser, deleteAdminUser, getAdminUsers, updateAdminUser } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(['student', 'teacher', 'admin', 'super_admin'])
});

const updateSchema = schema.extend({
  profileId: z.string().min(1),
  status: z.enum(['active', 'inactive', 'suspended'])
});

export async function GET() {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ items: getAdminUsers() });
}

export async function POST(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = schema.parse(await request.json());
  const user = addAdminUser(payload);

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'admin_user.created',
    entityType: 'profile',
    entityId: user.profileId,
    metadata: payload
  });

  return NextResponse.json({ item: user }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = updateSchema.parse(await request.json());
  const user = updateAdminUser(payload);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'admin_user.updated',
    entityType: 'profile',
    entityId: user.profileId,
    metadata: payload
  });

  return NextResponse.json({ item: user });
}

export async function DELETE(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profileId = new URL(request.url).searchParams.get('profileId');
  if (!profileId) {
    return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
  }

  const removed = deleteAdminUser(profileId);
  if (!removed) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'admin_user.deleted',
    entityType: 'profile',
    entityId: profileId,
    metadata: {}
  });

  return NextResponse.json({ item: removed });
}
