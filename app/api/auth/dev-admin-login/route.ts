import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { isDevAuthEnabled, isSecureCookieRequired } from '@/lib/auth/dev-auth';
import { getSafeNext } from '@/lib/auth/safe-redirect';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

function readLineBindingInput(request: Request) {
  const url = new URL(request.url);
  const lineUserId = url.searchParams.get('lineUserId')?.trim();
  const displayName = url.searchParams.get('displayName')?.trim();

  if (!lineUserId) {
    return null;
  }

  return {
    lineUserId,
    displayName: displayName && displayName.length > 0 ? displayName : 'DEV Admin'
  };
}

export async function GET(request: Request) {
  if (!isDevAuthEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const next = getSafeNext(url.searchParams.get('next'), '/admin');

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role')
    .in('role', ['super_admin', 'admin'])
    .eq('status', 'active')
    .order('role', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!profile?.id) {
    const redirectUrl = new URL('/register/super-admin', request.url);
    redirectUrl.searchParams.set('reason', 'no-admin');
    redirectUrl.searchParams.set('next', next);

    const lineUserId = url.searchParams.get('lineUserId')?.trim();
    if (lineUserId) {
      redirectUrl.searchParams.set('lineUserId', lineUserId);
    }

    return NextResponse.redirect(redirectUrl);
  }

  const bindingInput = readLineBindingInput(request);
  if (bindingInput) {
    const { error: bindError } = await admin.from('line_accounts').upsert(
      {
        profile_id: profile.id,
        line_user_id: bindingInput.lineUserId,
        display_name: bindingInput.displayName,
        is_verified: true,
        last_login_at: new Date().toISOString()
      },
      { onConflict: 'profile_id' }
    );

    if (bindError) {
      return NextResponse.json(
        {
          error: `Unable to bind LINE account for admin profile: ${bindError.message}`
        },
        { status: 409 }
      );
    }
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

  const redirectUrl = new URL(next, request.url);
  redirectUrl.searchParams.set('devLogin', '1');
  return NextResponse.redirect(redirectUrl);
}
