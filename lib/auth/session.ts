import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AppRole } from '@/lib/types';
import { getDemoAccounts, getProfile } from '@/lib/services/app-data';

const SESSION_COOKIE = 'attendance_demo_session';

export async function getSessionProfile() {
  const store = await cookies();
  const profileId = store.get(SESSION_COOKIE)?.value;
  if (!profileId) {
    return null;
  }

  const profile = getProfile(profileId);
  if (!profile || profile.status !== 'active') {
    return null;
  }

  return profile;
}

export async function requireSessionProfile(roles?: AppRole[]) {
  const profile = await getSessionProfile();
  if (!profile) {
    redirect('/?auth=required');
  }

  if (roles && !roles.includes(profile.role)) {
    redirect('/?auth=forbidden');
  }

  return profile;
}

export async function getDemoAccountSummaries() {
  return getDemoAccounts();
}

export { SESSION_COOKIE };
