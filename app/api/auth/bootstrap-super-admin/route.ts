import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { isSecureCookieRequired } from '@/lib/auth/dev-auth';
import { getSafeNext } from '@/lib/auth/safe-redirect';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const schema = z.object({
  secret: z.string().min(1),
  lineUserId: z.string().min(5),
  fullNameTh: z.string().min(2).max(120).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  next: z.string().optional().or(z.literal(''))
});

export async function POST(request: Request) {
  const expectedSecret = process.env.BOOTSTRAP_ADMIN_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Bootstrap is disabled. Set BOOTSTRAP_ADMIN_SECRET first.' }, { status: 403 });
  }

  const form = await request.formData();
  const parsed = schema.safeParse({
    secret: form.get('secret'),
    lineUserId: form.get('lineUserId'),
    fullNameTh: form.get('fullNameTh'),
    email: form.get('email'),
    next: form.get('next')
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid bootstrap secret' }, { status: 401 });
  }

  const normalizedFullName = parsed.data.fullNameTh?.trim() || 'Super Admin';
  const nextPath = getSafeNext(parsed.data.next || null, '/admin?bootstrap=1');

  const admin = createSupabaseAdminClient();
  const { data: existingOrg } = await admin.from('organizations').select('id').limit(1).maybeSingle();

  let orgId = existingOrg?.id;

  if (!orgId) {
    await admin
      .from('organizations')
      .upsert(
        {
          code: 'BOOTSTRAP',
          name_th: 'Bootstrap Organization',
          name_en: 'Bootstrap Organization'
        },
        { onConflict: 'code' }
      );

    const { data: bootstrapOrg } = await admin
      .from('organizations')
      .select('id')
      .eq('code', 'BOOTSTRAP')
      .maybeSingle();

    orgId = bootstrapOrg?.id;
  }

  if (!orgId) {
    return NextResponse.json({ error: 'Bootstrap organization is unavailable. Please configure the database first.' }, { status: 500 });
  }

  let profileId: string;

  const { data: existingLineAccount } = await admin
    .from('line_accounts')
    .select('profile_id, profiles!inner(id, role, status)')
    .eq('line_user_id', parsed.data.lineUserId)
    .maybeSingle();

  if (existingLineAccount?.profile_id) {
    const profile = Array.isArray(existingLineAccount.profiles)
      ? existingLineAccount.profiles[0]
      : existingLineAccount.profiles;

    if (!profile || profile.status !== 'active') {
      return NextResponse.json({ error: 'Existing LINE account is bound to inactive profile' }, { status: 409 });
    }

    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Existing LINE account is bound to a non-admin profile' }, { status: 409 });
    }

    profileId = existingLineAccount.profile_id;
    await admin.from('profiles').update({ role: 'super_admin' }).eq('id', profileId);
  } else {
    const { data: createdProfile, error: profileError } = await admin
      .from('profiles')
      .insert({
        organization_id: orgId,
        full_name_th: normalizedFullName,
        email: parsed.data.email || null,
        role: 'super_admin',
        status: 'active',
        locale: 'th'
      })
      .select('id')
      .single();

    if (profileError || !createdProfile?.id) {
      return NextResponse.json({ error: profileError?.message ?? 'Failed to create profile' }, { status: 500 });
    }

    profileId = createdProfile.id;
  }

  await admin.from('admin_roles').upsert(
    {
      profile_id: profileId,
      role: 'super_admin'
    },
    { onConflict: 'profile_id,role' }
  );

  const { error: lineError } = await admin.from('line_accounts').upsert(
    {
      profile_id: profileId,
      line_user_id: parsed.data.lineUserId,
      display_name: normalizedFullName,
      is_verified: true,
      last_login_at: new Date().toISOString()
    },
    { onConflict: 'profile_id' }
  );

  if (lineError) {
    return NextResponse.json({ error: lineError.message }, { status: 409 });
  }

  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    JSON.stringify({ profileId, role: 'super_admin' }),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureCookieRequired(),
      path: '/',
      maxAge: 60 * 60 * 8
    }
  );

  return NextResponse.redirect(new URL(nextPath, request.url));
}
