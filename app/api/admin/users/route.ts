import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LINE_ID_COOKIE, getSessionProfile } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { addAdminUser, deleteAdminUser, getAdminUsers, updateAdminUser } from '@/lib/services/app-data';
import { writeAuditLog } from '@/lib/services/audit-log';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(['student', 'teacher', 'admin', 'super_admin']),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  lineUserId: z.string().min(5).optional().or(z.literal(''))
});

const updateSchema = schema.extend({
  profileId: z.string().min(1),
  status: z.enum(['active', 'inactive', 'suspended'])
});

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

  const { data: bootstrapOrg } = await admin.from('organizations').select('id').eq('code', 'BOOTSTRAP').maybeSingle();
  return bootstrapOrg?.id ?? null;
}

async function syncLineAccountToSupabase(input: {
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  status: 'active' | 'inactive' | 'suspended';
  lineUserId?: string;
}) {
  const lineUserId = input.lineUserId?.trim();
  if (!lineUserId) {
    return;
  }

  const orgId = await resolveOrganizationId();
  if (!orgId) {
    throw new Error('Cannot link LINE account: no organization available');
  }

  const admin = createSupabaseAdminClient();
  const { data: existingProfile } = await admin.from('profiles').select('id').eq('email', input.email).maybeSingle();

  let profileId = existingProfile?.id;
  if (!profileId) {
    const { data: createdProfile, error: profileError } = await admin
      .from('profiles')
      .insert({
        organization_id: orgId,
        full_name_th: input.name,
        email: input.email,
        role: input.role,
        status: input.status,
        locale: 'th'
      })
      .select('id')
      .single();

    if (profileError || !createdProfile?.id) {
      throw new Error(profileError?.message ?? 'Cannot create profile for LINE linking');
    }

    profileId = createdProfile.id;
  } else {
    await admin.from('profiles').update({
      full_name_th: input.name,
      role: input.role,
      status: input.status
    }).eq('id', profileId);
  }

  if (input.role === 'admin' || input.role === 'super_admin') {
    await admin.from('admin_roles').upsert(
      {
        profile_id: profileId,
        role: input.role
      },
      { onConflict: 'profile_id,role' }
    );
  }

  const { error: lineError } = await admin.from('line_accounts').upsert(
    {
      profile_id: profileId,
      line_user_id: lineUserId,
      display_name: input.name,
      is_verified: true,
      last_login_at: new Date().toISOString()
    },
    { onConflict: 'profile_id' }
  );

  if (lineError) {
    throw new Error(lineError.message);
  }
}

export async function GET() {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ items: getAdminUsers() });
}

export async function POST(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await readValidatedJson(request, schema);
  if (!parsed.success) {
    return parsed.response;
  }

  const payload = parsed.data;
  const store = await cookies();
  const currentLineUserId = store.get(LINE_ID_COOKIE)?.value;
  const linkedLineUserId = payload.lineUserId?.trim() || currentLineUserId || undefined;

  try {
    await syncLineAccountToSupabase({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      status: payload.status ?? 'active',
      lineUserId: linkedLineUserId
    });
  } catch (syncError) {
    return NextResponse.json({ error: syncError instanceof Error ? syncError.message : 'Cannot link LINE account' }, { status: 409 });
  }

  const user = addAdminUser({ ...payload, lineUserId: linkedLineUserId });

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'admin_user.created',
    entityType: 'profile',
    entityId: user.profileId,
    metadata: payload
  });

  return NextResponse.json({ item: user }, { status: 201 });
}

export async function PATCH(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = await readValidatedJson(request, updateSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const payload = parsed.data;
  const store = await cookies();
  const currentLineUserId = store.get(LINE_ID_COOKIE)?.value;
  const linkedLineUserId = payload.lineUserId?.trim() || currentLineUserId || undefined;

  try {
    await syncLineAccountToSupabase({
      name: payload.name,
      email: payload.email,
      role: payload.role,
      status: payload.status,
      lineUserId: linkedLineUserId
    });
  } catch (syncError) {
    return NextResponse.json({ error: syncError instanceof Error ? syncError.message : 'Cannot link LINE account' }, { status: 409 });
  }

  const user = updateAdminUser({ ...payload, lineUserId: linkedLineUserId });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'admin_user.updated',
    entityType: 'profile',
    entityId: user.profileId,
    metadata: payload
  });

  return NextResponse.json({ item: user });
}

export async function DELETE(request: Request) {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profileId = new URL(request.url).searchParams.get('profileId');
  if (!profileId) {
    return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
  }

  const removed = deleteAdminUser(profileId);
  if (!removed) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'admin_user.deleted',
    entityType: 'profile',
    entityId: profileId,
    metadata: {}
  });

  return NextResponse.json({ item: removed });
}
