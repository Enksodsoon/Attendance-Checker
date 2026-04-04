import { afterEach, describe, expect, it, vi } from 'vitest';

const cookieGet = vi.fn();
const adminMaybeSingle = vi.fn();
const getUser = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: cookieGet
  }))
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: adminMaybeSingle
        }))
      }))
    }))
  })),
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser
    }
  }))
}));

import { isDevAuthEnabled } from '@/lib/auth/dev-auth';
import { getSessionProfile } from '@/lib/auth/session';

describe('auth model guards', () => {
  const originalAllowDevAuth = process.env.ALLOW_DEV_AUTH;

  afterEach(() => {
    process.env.ALLOW_DEV_AUTH = originalAllowDevAuth;
    cookieGet.mockReset();
    adminMaybeSingle.mockReset();
    getUser.mockReset();
  });

  it('keeps dev auth disabled unless explicitly enabled', () => {
    process.env.ALLOW_DEV_AUTH = undefined;
    expect(isDevAuthEnabled()).toBe(false);

    process.env.ALLOW_DEV_AUTH = 'true';
    expect(isDevAuthEnabled()).toBe(true);
  });

  it('rejects fake offline cookie sessions that do not map to a real profile', async () => {
    cookieGet.mockReturnValue({
      value: JSON.stringify({ profileId: 'offline-super-admin', role: 'super_admin' })
    });
    adminMaybeSingle.mockResolvedValue({ data: null });
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await getSessionProfile();
    expect(result).toBeNull();
  });
});
