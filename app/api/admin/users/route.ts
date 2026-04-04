import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionProfile } from '@/lib/auth/session';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/services/audit-log';
import { readValidatedJson } from '@/lib/utils/api';

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  role: z.enum(['student', 'teacher', 'admin', 'super_admin']),
  status: z.enum(['active', 'inactive', 'suspended']).optional()
});

const updateSchema = schema.extend({
  profileId: z.string().uuid(),
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

function mapItems(rows: Array<Record<string, unknown>>) {
  return rows.map((row) => {
    const student = Array.isArray(row.students) ? row.students[0] : row.students;
    const line = Array.isArray(row.line_accounts) ? row.line_accounts[0] : row.line_accounts;
    return {
      profileId: String(row.id),
      name: String(row.full_name_th ?? ''),
      email: String(row.email ?? ''),
      role: String(row.role) as 'student' | 'teacher' | 'admin' | 'super_admin',
      status: String(row.status) as 'active' | 'inactive' | 'suspended',
      lastActiveAt: String(row.updated_at ?? new Date().toISOString()),
      linkedStudentCode: student?.student_code ? String(student.student_code) : undefined,
      lineUserId: line?.line_user_id ? String(line.line_user_id) : undefined
    };
  });
}

export async function GET() {
  const actor = await getSessionProfile();
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name_th, email, role, status, updated_at, students(student_code), line_accounts(line_user_id)')
    .in('role', ['student', 'teacher', 'admin', 'super_admin'])
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: mapItems((data as Array<Record<string, unknown>>) ?? []) });
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

  const orgId = await resolveOrganizationId();
  if (!orgId) {
    return NextResponse.json({ error: 'Unable to resolve organization' }, { status: 500 });
  }

  const payload = parsed.data;
  const admin = createSupabaseAdminClient();
  const { data: created, error } = await admin
    .from('profiles')
    .insert({
      organization_id: orgId,
      full_name_th: payload.name,
      email: payload.email,
      role: payload.role,
      status: payload.status ?? 'active',
      locale: 'th'
    })
    .select('id, full_name_th, email, role, status, updated_at')
    .single();

  if (error || !created?.id) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create profile' }, { status: 500 });
  }

  if (payload.role === 'admin' || payload.role === 'super_admin') {
    await admin.from('admin_roles').upsert(
      {
        profile_id: created.id,
        role: payload.role
      },
      { onConflict: 'profile_id,role' }
    );
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'admin_user.created',
    entityType: 'profile',
    entityId: created.id,
    metadata: payload
  });

  return NextResponse.json({
    item: {
      profileId: created.id,
      name: created.full_name_th,
      email: created.email ?? '',
      role: created.role,
      status: created.status,
      lastActiveAt: created.updated_at
    }
  }, { status: 201 });
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
  const admin = createSupabaseAdminClient();
  const { data: updated, error } = await admin
    .from('profiles')
    .update({
      full_name_th: payload.name,
      email: payload.email,
      role: payload.role,
      status: payload.status
    })
    .eq('id', payload.profileId)
    .select('id, full_name_th, email, role, status, updated_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!updated?.id) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (payload.role === 'admin' || payload.role === 'super_admin') {
    await admin.from('admin_roles').upsert(
      {
        profile_id: payload.profileId,
        role: payload.role
      },
      { onConflict: 'profile_id,role' }
    );
  } else {
    await admin.from('admin_roles').delete().eq('profile_id', payload.profileId);
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'admin_user.updated',
    entityType: 'profile',
    entityId: updated.id,
    metadata: payload
  });

  return NextResponse.json({
    item: {
      profileId: updated.id,
      name: updated.full_name_th,
      email: updated.email ?? '',
      role: updated.role,
      status: updated.status,
      lastActiveAt: updated.updated_at
    }
  });
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

  const admin = createSupabaseAdminClient();
  const { data: updated, error } = await admin
    .from('profiles')
    .update({ status: 'inactive' })
    .eq('id', profileId)
    .select('id, full_name_th, email, role, status, updated_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!updated?.id) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await writeAuditLog({
    actorProfileId: actor.profileId,
    actionType: 'admin_user.deleted',
    entityType: 'profile',
    entityId: profileId,
    metadata: {}
  });

  return NextResponse.json({
    item: {
      profileId: updated.id,
      name: updated.full_name_th,
      email: updated.email ?? '',
      role: updated.role,
      status: updated.status,
      lastActiveAt: updated.updated_at
    }
  });
}
