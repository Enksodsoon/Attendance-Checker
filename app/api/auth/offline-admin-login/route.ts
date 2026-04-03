import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

async function resolveOrganizationId() {
  const admin = createSupabaseAdminClient();
  const { data: existingOrg } = await admin.from('organizations').select('id').limit(1).maybeSingle();
  if (existingOrg?.id) return existingOrg.id;

  await admin.from('organizations').upsert(
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

  return bootstrapOrg?.id ?? null;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.OFFLINE_ADMIN_LOGIN_SECRET;
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Offline admin login is disabled' }, { status: 403 });
  }

  const form = await request.formData();
  const secret = String(form.get('secret') ?? '');
  const lineUserId = String(form.get('lineUserId') ?? '').trim();
  const fullNameTh = String(form.get('fullNameTh') ?? '').trim() || 'Offline Admin';
  const email = String(form.get('email') ?? '').trim() || null;

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  let profileId = 'offline-super-admin';
  let role = 'super_admin';
  let lineBound = false;

  if (lineUserId) {
    try {
      const admin = createSupabaseAdminClient();
      const orgId = await resolveOrganizationId();
      if (!orgId) {
        throw new Error('Organization resolution failed');
      }

      const { data: existingLineAccount } = await admin
        .from('line_accounts')
        .select('profile_id, profiles!inner(id, role, status)')
        .eq('line_user_id', lineUserId)
        .maybeSingle();

      if (existingLineAccount?.profile_id) {
        const profile = Array.isArray(existingLineAccount.profiles)
          ? existingLineAccount.profiles[0]
          : existingLineAccount.profiles;

        if (!profile || profile.status !== 'active') {
          throw new Error('LINE account is bound to inactive profile');
        }

        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
          throw new Error('LINE account is bound to non-admin profile');
        }

        profileId = existingLineAccount.profile_id;
        await admin.from('profiles').update({ role: 'super_admin' }).eq('id', profileId);
      } else {
        const { data: createdProfile, error: profileError } = await admin
          .from('profiles')
          .insert({
            organization_id: orgId,
            full_name_th: fullNameTh,
            email,
            role: 'super_admin',
            status: 'active',
            locale: 'th'
          })
          .select('id')
          .single();

        if (profileError || !createdProfile?.id) {
          throw new Error(profileError?.message ?? 'Failed to create profile');
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
          line_user_id: lineUserId,
          display_name: fullNameTh,
          is_verified: true,
          last_login_at: new Date().toISOString()
        },
        { onConflict: 'profile_id' }
      );

      if (lineError) {
        throw new Error(lineError.message);
      }

      lineBound = true;
    } catch {
      // keep offline fallback session even if binding fails
      profileId = 'offline-super-admin';
      role = 'super_admin';
      lineBound = false;
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

  const redirectUrl = new URL(`/admin?offline=1${lineBound ? '&lineBound=1' : ''}`, request.url);
  return NextResponse.redirect(redirectUrl);
}
