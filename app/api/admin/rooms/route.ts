import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addAdminRoom, getAdminRooms } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  roomId: z.string().min(2).max(40),
  roomName: z.string().min(2).max(120),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  radiusM: z.coerce.number().positive().max(1000),
  gpsPolicy: z.enum(['strict', 'allow_manual_approval'])
});

export async function GET() {
  return NextResponse.json({ items: getAdminRooms() });
}

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());
  const room = addAdminRoom(payload);

  await writeAuditLog({
    actorProfileId: 'profile-admin-01',
    actionType: 'room.created',
    entityType: 'room',
    entityId: room.roomId,
    metadata: payload
  });

  return NextResponse.json({ item: room }, { status: 201 });
}
