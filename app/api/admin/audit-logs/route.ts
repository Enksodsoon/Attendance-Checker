import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { getAuditLogs } from '@/lib/services/app-data';

export async function GET() {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin', 'teacher'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ items: getAuditLogs() });
}
