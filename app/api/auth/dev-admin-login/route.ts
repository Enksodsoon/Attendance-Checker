import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';
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
  // DEV-ONLY temporary unblock route. Remove after migrating admin auth fully to Supabase Auth.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

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
    return NextResponse.json({ error: 'No active admin/super_admin profile found for dev impersonation' }, { status: 404 });
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
      secure: false,
      path: '/',
      maxAge: 60 * 60 * 8
    }
  );

  const redirectUrl = new URL('/admin?devLogin=1', request.url);
  return NextResponse.redirect(redirectUrl);
}
