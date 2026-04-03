import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // DEV-ONLY temporary unblock route. Remove after migrating admin auth fully to Supabase Auth.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, role')
    .in('role', ['super_admin', 'admin'])
    .eq('status', 'active')
    .order('role', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.id) {
    return NextResponse.json({ error: 'No active admin/super_admin profile found for dev impersonation' }, { status: 404 });
  }

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    JSON.stringify({ profileId: data.id, role: data.role }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 8
    }
  );

  const redirectUrl = new URL('/admin?devLogin=1', request.url);
  return NextResponse.redirect(redirectUrl);
}
