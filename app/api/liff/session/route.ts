import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LINE_ID_COOKIE, SESSION_COOKIE } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { resolveLineAccount } from '@/lib/services/db/student-attendance';
import { resolveProfileByLineUserId } from '@/lib/services/app-data';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  lineUserId: z.string().min(5)
});

export async function POST(request: Request) {
  const parsed = await readValidatedJson(request, schema);
  if (!parsed.success) {
    return parsed.response;
  }

  const lineUserId = parsed.data.lineUserId;
  const account = (await resolveLineAccount(lineUserId)) ?? resolveProfileByLineUserId(lineUserId);

  let profileId = account?.profileId;
  let role = account?.role;
  let devAutoBound = false;
  let offlineFallback = false;

  if (!account) {
    if (process.env.ALLOW_OFFLINE_DEV_SESSION === 'true') {
      profileId = 'offline-super-admin';
      role = 'super_admin';
      offlineFallback = true;
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'LINE account is not linked to student profile' }, { status: 404 });
    } else {
      const admin = createSupabaseAdminClient();
      const { data: devProfile } = await admin
        .from('profiles')
        .select('id, role')
        .in('role', ['super_admin', 'admin'])
        .eq('status', 'active')
        .order('role', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!devProfile?.id) {
        return NextResponse.json({ error: 'DEV fallback failed: no active admin/super_admin profile available' }, { status: 404 });
      }

      const { error: bindError } = await admin.from('line_accounts').upsert(
        {
          profile_id: devProfile.id,
          line_user_id: lineUserId,
          display_name: 'DEV LIFF AUTO-BIND',
          is_verified: true,
          last_login_at: new Date().toISOString()
        },
        { onConflict: 'profile_id' }
      );

      if (bindError) {
        return NextResponse.json({ error: `DEV fallback failed: ${bindError.message}` }, { status: 409 });
      }

      profileId = devProfile.id;
      role = devProfile.role;
      devAutoBound = true;
    }
  }

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    JSON.stringify({ profileId, role }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8
    }
  );


  store.set(
    LINE_ID_COOKIE,
    lineUserId,
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8
    }
  );

  return NextResponse.json({ status: 'ok', profileId, role, devAutoBound, offlineFallback });
}
