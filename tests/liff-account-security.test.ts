import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: vi.fn() }))
}));

vi.mock('@/lib/auth/dev-auth', () => ({
  isSecureCookieRequired: vi.fn(() => false)
}));

vi.mock('@/lib/auth/session', () => ({
  SESSION_COOKIE: 'attendance_session',
  LINE_ID_COOKIE: 'attendance_line_user_id',
  getSessionProfile: vi.fn()
}));

vi.mock('@/lib/auth/line', () => ({
  verifyLineIdentity: vi.fn()
}));

vi.mock('@/lib/services/db/accounts', () => ({
  findProfileByLineUserId: vi.fn(),
  updateLineAccountLoginMetadata: vi.fn(),
  claimStudentProfileWithLine: vi.fn(),
  updateOwnAccount: vi.fn()
}));

import { POST as liffSessionPost } from '@/app/api/liff/session/route';
import { POST as liffRegisterPost } from '@/app/api/liff/register/route';
import { PATCH as accountPatch } from '@/app/api/account/route';
import { getSessionProfile } from '@/lib/auth/session';
import { claimStudentProfileWithLine, findProfileByLineUserId, updateOwnAccount } from '@/lib/services/db/accounts';
import { verifyLineIdentity } from '@/lib/auth/line';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('LIFF and account security flows', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects forged typed lineUserId when LINE verification fails with mismatch', async () => {
    vi.mocked(verifyLineIdentity).mockRejectedValue(new Error('LINE identity mismatch'));

    const response = await liffSessionPost(new Request('http://localhost/api/liff/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lineUserId: 'U-forged-user',
        accessToken: 'valid-access-token-12345',
        displayName: 'Forged User'
      })
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ status: 'verification_failed' });
  });

  it('returns registration_required when verified LINE account is not linked', async () => {
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-line-1',
      displayName: 'Student A'
    });
    vi.mocked(findProfileByLineUserId).mockResolvedValue(null);

    const response = await liffSessionPost(new Request('http://localhost/api/liff/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-access-token-12345' })
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'registration_required' });
  });

  it('claims an existing unlinked student record successfully', async () => {
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-line-2',
      displayName: 'Student B'
    });
    vi.mocked(claimStudentProfileWithLine).mockResolvedValue({
      profileId: 'profile-student-1',
      role: 'student'
    });

    const response = await liffRegisterPost(new Request('http://localhost/api/liff/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentCode: '6512345678',
        fullNameTh: 'Student B',
        accessToken: 'valid-access-token-12345'
      })
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'ok', role: 'student' });
  });

  it('rejects claim when student profile is already linked', async () => {
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-line-3',
      displayName: 'Student C'
    });
    vi.mocked(claimStudentProfileWithLine).mockRejectedValue(new Error('PROFILE_ALREADY_LINKED: conflict'));

    const response = await liffRegisterPost(new Request('http://localhost/api/liff/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentCode: '6511111111',
        fullNameTh: 'Student C',
        accessToken: 'valid-access-token-12345'
      })
    }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: 'This student record is already linked to another LINE account.'
    });
  });

  it('rejects claim when LINE account is already linked elsewhere', async () => {
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-line-4',
      displayName: 'Student D'
    });
    vi.mocked(claimStudentProfileWithLine).mockRejectedValue(new Error('LINE_ALREADY_LINKED: conflict'));

    const response = await liffRegisterPost(new Request('http://localhost/api/liff/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentCode: '6522222222',
        fullNameTh: 'Student D',
        accessToken: 'valid-access-token-12345'
      })
    }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: 'LINE account is already linked. Please sign in with your existing account.'
    });
  });

  it('blocks account PATCH from changing line identity fields', async () => {
    vi.mocked(getSessionProfile).mockResolvedValue({
      profileId: 'profile-student-1',
      role: 'student',
      name: 'Student B',
      email: 'student@u.ac.th',
      status: 'active',
      lastActiveAt: new Date().toISOString()
    });

    const response = await accountPatch(new Request('http://localhost/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullNameTh: 'Student B',
        lineUserId: 'U-override-attempt'
      })
    }));

    expect(response.status).toBe(400);
    expect(updateOwnAccount).not.toHaveBeenCalled();
  });

  it('keeps one-shot bootstrap guard and hard redirect flow in LIFF bootstrap component', () => {
    const source = readFileSync(join(process.cwd(), 'components/student/liff-bootstrap.tsx'), 'utf8');
    expect(source).toContain('startedRef.current');
    expect(source).toContain("window.location.replace('/liff')");
    expect(source).not.toContain('router.refresh()');
  });
});
