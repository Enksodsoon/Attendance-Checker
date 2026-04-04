import { NextResponse } from 'next/server';
import { getSessionProfile } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function DELETE(_request: Request, context: { params: Promise<{ profileId: string }> }) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profileId } = await context.params;
  if (!profileId) {
    return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('line_accounts').delete().eq('profile_id', profileId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok' });
}
