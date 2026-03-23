import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { addAdminRoom, deleteAdminRoom, getAdminRooms, updateAdminRoom } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  roomId: z.string().min(2).max(40),
  roomName: z.string().min(2).max(120),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  radiusM: z.coerce.number().positive().max(1000),
  gpsPolicy: z.enum(['strict', 'allow_manual_approval'])
});

const updateSchema = schema.extend({
  roomId: z.string().min(2).max(40)
});

export async function GET() {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ items: getAdminRooms() });
}

export async function POST(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = schema.parse(await request.json());
  const room = addAdminRoom(payload);

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'room.created',
    entityType: 'room',
    entityId: room.roomId,
    metadata: payload
  });

  return NextResponse.json({ item: room }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = updateSchema.parse(await request.json());
  const room = updateAdminRoom(payload);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'room.updated',
    entityType: 'room',
    entityId: room.roomId,
    metadata: payload
  });

  return NextResponse.json({ item: room });
}

export async function DELETE(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roomId = new URL(request.url).searchParams.get('roomId');
  if (!roomId) {
    return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
  }

  const room = deleteAdminRoom(roomId);
  if (!room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'room.deleted',
    entityType: 'room',
    entityId: roomId,
    metadata: {}
  });

  return NextResponse.json({ item: room });
}
