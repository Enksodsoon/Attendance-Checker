import { createSupabaseAdminClient } from '@/lib/supabase/server';

type Role = 'student' | 'teacher' | 'admin' | 'super_admin';

function mapRole(role: string): Role {
  if (role === 'teacher' || role === 'admin' || role === 'super_admin') {
    return role;
  }
  return 'student';
}

export async function ensureDefaultOrganization() {
  const admin = createSupabaseAdminClient();
  const fallbackCode = process.env.DEFAULT_ORGANIZATION_CODE || 'DEFAULT';
  const fallbackNameTh = process.env.DEFAULT_ORGANIZATION_NAME_TH || 'Default Organization';
  const fallbackNameEn = process.env.DEFAULT_ORGANIZATION_NAME_EN || fallbackNameTh;

  const { data: byCode } = await admin
    .from('organizations')
    .select('id')
    .eq('code', fallbackCode)
    .limit(1)
    .maybeSingle();

  if (byCode?.id) {
    return byCode.id;
  }

  const { data: existing } = await admin.from('organizations').select('id').limit(1).maybeSingle();
  if (existing?.id) {
    return existing.id;
  }

  await admin.from('organizations').upsert(
    {
      code: fallbackCode,
      name_th: fallbackNameTh,
      name_en: fallbackNameEn
    },
    { onConflict: 'code' }
  );

  const { data: created } = await admin
    .from('organizations')
    .select('id')
    .eq('code', fallbackCode)
    .limit(1)
    .maybeSingle();

  if (!created?.id) {
    throw new Error('Unable to prepare default organization');
  }

  return created.id;
}

export async function findProfileByLineUserId(lineUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('line_accounts')
    .select('profile_id, line_user_id, profiles!inner(role, status)')
    .eq('line_user_id', lineUserId)
    .maybeSingle();

  const profileRow = Array.isArray(data?.profiles) ? data.profiles[0] : data?.profiles;
  if (!data || !profileRow || profileRow.status !== 'active') {
    return null;
  }

  return {
    profileId: data.profile_id,
    lineUserId: data.line_user_id,
    role: mapRole(String(profileRow.role))
  };
}

export async function updateLineAccountLoginMetadata(input: {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
}) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('line_accounts')
    .update({
      display_name: input.displayName,
      picture_url: input.pictureUrl ?? null,
      last_login_at: new Date().toISOString(),
      is_verified: true
    })
    .eq('line_user_id', input.lineUserId);

  if (error) {
    throw error;
  }
}

export async function createStudentFromLineRegistration(input: {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  fullNameTh: string;
  studentCode: string;
  email?: string;
  academicYear?: number;
  facultyName?: string;
}) {
  const admin = createSupabaseAdminClient();
  const organizationId = await ensureDefaultOrganization();

  const { data: existingLink } = await admin
    .from('line_accounts')
    .select('profile_id')
    .eq('line_user_id', input.lineUserId)
    .maybeSingle();

  if (existingLink?.profile_id) {
    throw new Error('LINE account is already linked to another profile');
  }

  const { data: createdProfile, error: profileError } = await admin
    .from('profiles')
    .insert({
      organization_id: organizationId,
      full_name_th: input.fullNameTh,
      email: input.email || null,
      role: 'student',
      status: 'active',
      locale: 'th'
    })
    .select('id, role')
    .single();

  if (profileError || !createdProfile?.id) {
    throw profileError ?? new Error('Failed to create profile');
  }

  const { error: studentError } = await admin.from('students').insert({
    profile_id: createdProfile.id,
    student_code: input.studentCode,
    academic_year: input.academicYear ?? null,
    faculty_name_th: input.facultyName ?? null
  });

  if (studentError) {
    await admin.from('profiles').delete().eq('id', createdProfile.id);
    throw studentError;
  }

  const { error: lineError } = await admin.from('line_accounts').insert({
    profile_id: createdProfile.id,
    line_user_id: input.lineUserId,
    display_name: input.displayName,
    picture_url: input.pictureUrl ?? null,
    is_verified: true,
    last_login_at: new Date().toISOString()
  });

  if (lineError) {
    await admin.from('students').delete().eq('profile_id', createdProfile.id);
    await admin.from('profiles').delete().eq('id', createdProfile.id);
    throw lineError;
  }

  return {
    profileId: createdProfile.id,
    role: mapRole(String(createdProfile.role))
  };
}
