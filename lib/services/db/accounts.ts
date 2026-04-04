import { createSupabaseAdminClient } from '@/lib/supabase/server';

type Role = 'student' | 'teacher' | 'admin' | 'super_admin';

function mapRole(role: string): Role {
  if (role === 'teacher' || role === 'admin' || role === 'super_admin') {
    return role;
  }
  return 'student';
}

function codedError(code: string, message: string) {
  return new Error(`${code}: ${message}`);
}

export type AccountView = {
  profileId: string;
  role: Role;
  fullNameTh: string;
  email: string;
  lineAccount: {
    lineUserId: string;
    displayName?: string;
    pictureUrl?: string;
  } | null;
  student?: {
    studentCode: string;
    academicYear?: number;
    facultyName?: string;
  };
  teacher?: {
    teacherCode: string;
    departmentName?: string;
  };
};

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
    throw codedError('DEFAULT_ORG_UNAVAILABLE', 'Unable to prepare default organization');
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
    throw codedError('LINE_ALREADY_LINKED', 'LINE account is already linked to another profile');
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
    throw profileError ?? codedError('PROFILE_CREATE_FAILED', 'Failed to create profile');
  }
  const createdProfileId = createdProfile.id;

  async function rollbackProfileArtifacts() {
    await admin.from('students').delete().eq('profile_id', createdProfileId);
    await admin.from('line_accounts').delete().eq('profile_id', createdProfileId);
    await admin.from('profiles').delete().eq('id', createdProfileId);
  }

  const { error: studentError } = await admin.from('students').insert({
    profile_id: createdProfileId,
    student_code: input.studentCode,
    academic_year: input.academicYear ?? null,
    faculty_name_th: input.facultyName ?? null
  });

  if (studentError) {
    await rollbackProfileArtifacts();
    throw studentError;
  }

  const { error: lineError } = await admin.from('line_accounts').insert({
    profile_id: createdProfileId,
    line_user_id: input.lineUserId,
    display_name: input.displayName,
    picture_url: input.pictureUrl ?? null,
    is_verified: true,
    last_login_at: new Date().toISOString()
  });

  if (lineError) {
    await rollbackProfileArtifacts();
    throw lineError;
  }

  return {
    profileId: createdProfileId,
    role: mapRole(String(createdProfile.role))
  };
}

export async function getAccountByProfileId(profileId: string): Promise<AccountView | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('profiles')
    .select(`
      id, role, full_name_th, email,
      line_accounts(line_user_id, display_name, picture_url),
      students(student_code, academic_year, faculty_name_th),
      teachers(teacher_code, department_name_th)
    `)
    .eq('id', profileId)
    .maybeSingle();

  if (!data) return null;

  const lineAccount = Array.isArray(data.line_accounts) ? data.line_accounts[0] : data.line_accounts;
  const student = Array.isArray(data.students) ? data.students[0] : data.students;
  const teacher = Array.isArray(data.teachers) ? data.teachers[0] : data.teachers;

  return {
    profileId: data.id,
    role: mapRole(String(data.role)),
    fullNameTh: String(data.full_name_th ?? ''),
    email: String(data.email ?? ''),
    lineAccount: lineAccount?.line_user_id
      ? {
          lineUserId: String(lineAccount.line_user_id),
          displayName: lineAccount.display_name ? String(lineAccount.display_name) : undefined,
          pictureUrl: lineAccount.picture_url ? String(lineAccount.picture_url) : undefined
        }
      : null,
    student: student?.student_code
      ? {
          studentCode: String(student.student_code),
          academicYear: student.academic_year ? Number(student.academic_year) : undefined,
          facultyName: student.faculty_name_th ? String(student.faculty_name_th) : undefined
        }
      : undefined,
    teacher: teacher?.teacher_code
      ? {
          teacherCode: String(teacher.teacher_code),
          departmentName: teacher.department_name_th ? String(teacher.department_name_th) : undefined
        }
      : undefined
  };
}

export async function updateOwnAccount(
  profileId: string,
  role: Role,
  input: { fullNameTh?: string; email?: string; academicYear?: number; facultyName?: string }
) {
  const admin = createSupabaseAdminClient();

  const profilePatch: Record<string, string | null> = {};
  if (input.fullNameTh !== undefined) profilePatch.full_name_th = input.fullNameTh.trim();
  if (input.email !== undefined) profilePatch.email = input.email.trim() || null;

  if (Object.keys(profilePatch).length > 0) {
    const { error } = await admin.from('profiles').update(profilePatch).eq('id', profileId);
    if (error) throw error;
  }

  if (role === 'student') {
    const studentPatch: Record<string, number | string | null> = {};
    if (input.academicYear !== undefined) studentPatch.academic_year = input.academicYear;
    if (input.facultyName !== undefined) studentPatch.faculty_name_th = input.facultyName.trim() || null;
    if (Object.keys(studentPatch).length > 0) {
      const { error } = await admin.from('students').update(studentPatch).eq('profile_id', profileId);
      if (error) throw error;
    }
  }

  return getAccountByProfileId(profileId);
}
