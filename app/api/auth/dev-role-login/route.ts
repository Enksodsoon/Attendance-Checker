import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { isDevAuthEnabled, isSecureCookieRequired } from '@/lib/auth/dev-auth';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

type DevRole = 'teacher' | 'admin' | 'super_admin';

function resolveRole(input: string | null): DevRole {
  if (input === 'teacher' || input === 'super_admin' || input === 'admin') {
    return input;
  }
  return 'admin';
}

export async function GET(request: Request) {
  if (!isDevAuthEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const role = resolveRole(url.searchParams.get('role'));
  const redirectPath = url.searchParams.get('next') ?? (role === 'teacher' ? '/teacher/sessions' : '/admin');

  const admin = createSupabaseAdminClient();

  const roles = role === 'admin' ? ['super_admin', 'admin'] : [role];
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role')
    .in('role', roles)
    .eq('status', 'active')
    .order('role', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!profile?.id) {
    return NextResponse.json(
      { error: `No active ${role} profile found. Create the first super admin at /register/super-admin` },
      { status: 404 }
    );
  }

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    JSON.stringify({ profileId: profile.id, role: profile.role }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureCookieRequired(),
      path: '/',
      maxAge: 60 * 60 * 8
    }
  );

  return NextResponse.redirect(new URL(redirectPath, request.url));
}
