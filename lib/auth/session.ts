import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AppRole, UserProfile } from '@/lib/types';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server';

export const SESSION_COOKIE = 'attendance_session';
export const LINE_ID_COOKIE = 'attendance_line_user_id';

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

function canUseOfflineSession() {
  return process.env.ALLOW_OFFLINE_DEV_SESSION === 'true';
}

async function getProfileById(profileId: string): Promise<UserProfile | null> {
  try {
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
  } catch {
    return null;
  }
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

        if (canUseOfflineSession()) {
          return {
            profileId: parsed.profileId,
            name: 'Offline Admin',
            email: '',
            role: mapRole(parsed.role),
            status: 'active',
            lastActiveAt: new Date().toISOString()
          } satisfies UserProfile;
        }
      }
    } catch {
      // ignore invalid cookie payload
    }
  }

  let user: { id: string; email?: string | null } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    user = null;
  }

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
