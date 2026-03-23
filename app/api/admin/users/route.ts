import { NextResponse } from 'next/server';
import { z } from 'zod';
import { addAdminUser, getAdminUsers } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(['student', 'teacher', 'admin', 'super_admin'])
});

export async function GET() {
  return NextResponse.json({ items: getAdminUsers() });
}

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());
  const user = addAdminUser(payload);

  await writeAuditLog({
    actorProfileId: 'profile-admin-01',
    actionType: 'admin_user.created',
    entityType: 'profile',
    entityId: user.profileId,
    metadata: payload
  });

  return NextResponse.json({ item: user }, { status: 201 });
}
