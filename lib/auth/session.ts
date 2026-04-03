import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AppRole, UserProfile } from '@/lib/types';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

export const SESSION_COOKIE = 'attendance_session';

interface SessionPayload {
  profileId: string;
  role: AppRole;
}

function mapRole(role: string): AppRole {
  if (role === 'student' || role === 'teacher' || role === 'admin' || role === 'super_admin') {
    return role;
  }
  return 'student';
}

async function getProfileById(profileId: string): Promise<UserProfile | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, full_name_th, email, role, status, updated_at')
    .eq('id', profileId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    profileId: data.id,
    name: data.full_name_th,
    email: data.email ?? '',
    role: mapRole(data.role),
    status: data.status,
    lastActiveAt: data.updated_at
  };
}

export async function getSessionProfile() {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SessionPayload;
      if (parsed.profileId) {
        const profile = await getProfileById(parsed.profileId);
        if (profile && profile.status === 'active') {
          return profile;
        }
      }
    } catch {
      // ignore invalid cookie payload
    }
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, full_name_th, email, role, status, updated_at, students(id), teachers(id)')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!data || data.status !== 'active') {
    return null;
  }

  return {
    profileId: data.id,
    name: data.full_name_th,
    email: data.email ?? user.email ?? '',
    role: mapRole(data.role),
    status: data.status,
    lastActiveAt: data.updated_at,
    studentId: Array.isArray(data.students) ? data.students[0]?.id : undefined,
    teacherId: Array.isArray(data.teachers) ? data.teachers[0]?.id : undefined
  } satisfies UserProfile;
}

export async function requireSessionProfile(roles?: AppRole[]) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/auth/required');
  }

  if (roles && !roles.includes(profile.role)) {
    redirect('/auth/forbidden');
  }

  return profile;
}

export async function getDemoAccountSummaries() {
  return [];
}
