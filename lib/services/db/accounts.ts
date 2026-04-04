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

export async function findAnyLineLinkByUserId(lineUserId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('line_accounts')
    .select('profile_id, line_user_id, profiles!inner(role, status)')
    .eq('line_user_id', lineUserId)
    .maybeSingle();

  const profileRow = Array.isArray(data?.profiles) ? data.profiles[0] : data?.profiles;
  if (!data || !profileRow) {
    return null;
  }

  return {
    profileId: data.profile_id,
    lineUserId: data.line_user_id,
    role: mapRole(String(profileRow.role)),
    status: String(profileRow.status)
  };
}

export async function getLineAccountByProfileId(profileId: string) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('line_accounts')
    .select('profile_id, line_user_id, display_name, picture_url')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (!data?.line_user_id) {
    return null;
  }

  return {
    profileId: data.profile_id,
    lineUserId: data.line_user_id,
    displayName: data.display_name ? String(data.display_name) : undefined,
    pictureUrl: data.picture_url ? String(data.picture_url) : undefined
  };
}

export async function linkVerifiedLineToExistingProfile(input: {
  profileId: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
}) {
  const admin = createSupabaseAdminClient();

  const existingByLine = await findAnyLineLinkByUserId(input.lineUserId);
  if (existingByLine?.profileId && existingByLine.profileId !== input.profileId) {
    throw codedError('LINE_ALREADY_LINKED', 'LINE account is already linked to another profile');
  }

  const existingByProfile = await getLineAccountByProfileId(input.profileId);
  if (existingByProfile?.lineUserId && existingByProfile.lineUserId !== input.lineUserId) {
    throw codedError('PROFILE_ALREADY_LINKED', 'This profile is already linked to another LINE account');
  }

  const { error } = await admin.from('line_accounts').upsert(
    {
      profile_id: input.profileId,
      line_user_id: input.lineUserId,
      display_name: input.displayName,
      picture_url: input.pictureUrl ?? null,
      is_verified: true,
      last_login_at: new Date().toISOString()
    },
    { onConflict: 'profile_id' }
  );

  if (error) {
    throw error;
  }

  return getLineAccountByProfileId(input.profileId);
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

export async function claimStudentProfileWithLine(input: {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  fullNameTh: string;
  studentCode: string;
}) {
  const admin = createSupabaseAdminClient();
  const trimmedCode = input.studentCode.trim();
  const trimmedName = input.fullNameTh.trim();

  const { data: existingLinkByLine } = await admin
    .from('line_accounts')
    .select('profile_id')
    .eq('line_user_id', input.lineUserId)
    .maybeSingle();

  if (existingLinkByLine?.profile_id) {
    throw codedError('LINE_ALREADY_LINKED', 'LINE account is already linked to another profile');
  }

  const { data: studentRow } = await admin
    .from('students')
    .select('profile_id, student_code, profiles!inner(id, full_name_th, role, status)')
    .eq('student_code', trimmedCode)
    .maybeSingle();

  const profileRow = Array.isArray(studentRow?.profiles) ? studentRow.profiles[0] : studentRow?.profiles;
  if (!studentRow || !profileRow || profileRow.role !== 'student' || profileRow.status !== 'active') {
    throw codedError('STUDENT_NOT_FOUND', 'No active student profile found for this student code');
  }

  if (String(profileRow.full_name_th).trim() !== trimmedName) {
    throw codedError('STUDENT_NAME_MISMATCH', 'Student name does not match school record');
  }

  const profileId = String(profileRow.id);
  const { data: existingLinkByProfile } = await admin
    .from('line_accounts')
    .select('line_user_id')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (existingLinkByProfile?.line_user_id && existingLinkByProfile.line_user_id !== input.lineUserId) {
    throw codedError('PROFILE_ALREADY_LINKED', 'This student profile is linked to another LINE account');
  }

  const { error: lineError } = await admin.from('line_accounts').upsert({
    profile_id: profileId,
    line_user_id: input.lineUserId,
    display_name: input.displayName,
    picture_url: input.pictureUrl ?? null,
    is_verified: true,
    last_login_at: new Date().toISOString()
  }, { onConflict: 'profile_id' });

  if (lineError) {
    throw lineError;
  }

  return {
    profileId,
    role: 'student' as const
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
