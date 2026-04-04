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
  findAnyLineLinkByUserId: vi.fn(),
  findStudentClaimCandidateByLineIdentity: vi.fn(),
  linkVerifiedLineToExistingProfile: vi.fn(),
  updateLineAccountLoginMetadata: vi.fn(),
  claimStudentProfileWithLine: vi.fn(),
  updateOwnAccount: vi.fn()
}));

import { POST as liffSessionPost } from '@/app/api/liff/session/route';
import { POST as liffRegisterPost } from '@/app/api/liff/register/route';
import { POST as linkLinePost } from '@/app/api/account/link-line/route';
import { PATCH as accountPatch } from '@/app/api/account/route';
import { markBootstrapStartedOnce } from '@/components/student/liff-bootstrap';
import { getSessionProfile } from '@/lib/auth/session';
import { claimStudentProfileWithLine, findAnyLineLinkByUserId, findProfileByLineUserId, findStudentClaimCandidateByLineIdentity, linkVerifiedLineToExistingProfile, updateOwnAccount } from '@/lib/services/db/accounts';
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
    vi.mocked(findAnyLineLinkByUserId).mockResolvedValue(null);
    vi.mocked(findStudentClaimCandidateByLineIdentity).mockResolvedValue({
      profileId: 'profile-student-claim',
      studentCode: '6512345678',
      fullNameTh: 'Student A'
    });

    const response = await liffSessionPost(new Request('http://localhost/api/liff/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-access-token-12345' })
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'registration_required' });
  });

  it('returns contact_admin when an unlinked LINE account is not eligible for student self-claim', async () => {
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-line-staff',
      displayName: 'Teacher X'
    });
    vi.mocked(findProfileByLineUserId).mockResolvedValue(null);
    vi.mocked(findAnyLineLinkByUserId).mockResolvedValue({
      profileId: 'profile-teacher-1',
      lineUserId: 'U-line-staff',
      role: 'teacher',
      status: 'inactive'
    });
    vi.mocked(findStudentClaimCandidateByLineIdentity).mockResolvedValue(null);

    const response = await liffSessionPost(new Request('http://localhost/api/liff/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-access-token-12345' })
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'contact_admin' });
  });

  it('signs in linked teacher accounts and returns teacher role', async () => {
    vi.mocked(verifyLineIdentity).mockResolvedValue({ lineUserId: 'U-teacher', displayName: 'Teacher' });
    vi.mocked(findProfileByLineUserId).mockResolvedValue({ profileId: 'profile-teacher', lineUserId: 'U-teacher', role: 'teacher' });

    const response = await liffSessionPost(new Request('http://localhost/api/liff/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-access-token-12345' })
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'ok', role: 'teacher' });
  });

  it('signs in linked admin accounts and returns admin role', async () => {
    vi.mocked(verifyLineIdentity).mockResolvedValue({ lineUserId: 'U-admin', displayName: 'Admin' });
    vi.mocked(findProfileByLineUserId).mockResolvedValue({ profileId: 'profile-admin', lineUserId: 'U-admin', role: 'admin' });

    const response = await liffSessionPost(new Request('http://localhost/api/liff/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-access-token-12345' })
    }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'ok', role: 'admin' });
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

  it('rejects claim when student name does not match school records', async () => {
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-line-5',
      displayName: 'Student E'
    });
    vi.mocked(claimStudentProfileWithLine).mockRejectedValue(new Error('STUDENT_NAME_MISMATCH: conflict'));

    const response = await liffRegisterPost(new Request('http://localhost/api/liff/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentCode: '6533333333',
        fullNameTh: 'Student E',
        accessToken: 'valid-access-token-12345'
      })
    }));

    expect(response.status).toBe(409);
  });

  it('rejects claim when student record is not found', async () => {
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-line-6',
      displayName: 'Student F'
    });
    vi.mocked(claimStudentProfileWithLine).mockRejectedValue(new Error('STUDENT_NOT_FOUND: conflict'));

    const response = await liffRegisterPost(new Request('http://localhost/api/liff/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentCode: '6544444444',
        fullNameTh: 'Student F',
        accessToken: 'valid-access-token-12345'
      })
    }));

    expect(response.status).toBe(404);
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

  it('bootstrap guard allows only one run within a mount cycle', () => {
    const guard = { current: false };
    expect(markBootstrapStartedOnce(guard)).toBe(true);
    expect(markBootstrapStartedOnce(guard)).toBe(false);
  });

  it('keeps hard redirects for deterministic post-login navigation', () => {
    const source = readFileSync(join(process.cwd(), 'components/student/liff-bootstrap.tsx'), 'utf8');
    expect(source).toContain("window.location.replace('/admin')");
    expect(source).toContain("window.location.replace('/teacher/sessions')");
    expect(source).toContain("window.location.replace('/liff')");
    expect(source).not.toContain('router.refresh()');
  });

  it('links LINE account for a signed-in user successfully', async () => {
    vi.mocked(getSessionProfile).mockResolvedValue({
      profileId: 'profile-1',
      role: 'student',
      name: 'A',
      email: '',
      status: 'active',
      lastActiveAt: new Date().toISOString()
    });
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-link-1',
      displayName: 'Line A'
    });
    vi.mocked(linkVerifiedLineToExistingProfile).mockResolvedValue({
      profileId: 'profile-1',
      lineUserId: 'U-link-1',
      displayName: 'Line A',
      pictureUrl: undefined
    });

    const response = await linkLinePost(new Request('http://localhost/api/account/link-line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-access-token-12345' })
    }));

    expect(response.status).toBe(200);
  });

  it('rejects signed-in linking when LINE account belongs to another profile', async () => {
    vi.mocked(getSessionProfile).mockResolvedValue({
      profileId: 'profile-1',
      role: 'student',
      name: 'A',
      email: '',
      status: 'active',
      lastActiveAt: new Date().toISOString()
    });
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-link-2',
      displayName: 'Line B'
    });
    vi.mocked(linkVerifiedLineToExistingProfile).mockRejectedValue(new Error('LINE_ALREADY_LINKED: conflict'));

    const response = await linkLinePost(new Request('http://localhost/api/account/link-line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-access-token-12345' })
    }));

    expect(response.status).toBe(409);
  });

  it('rejects signed-in linking when profile is linked to another LINE account', async () => {
    vi.mocked(getSessionProfile).mockResolvedValue({
      profileId: 'profile-1',
      role: 'student',
      name: 'A',
      email: '',
      status: 'active',
      lastActiveAt: new Date().toISOString()
    });
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-link-3',
      displayName: 'Line C'
    });
    vi.mocked(linkVerifiedLineToExistingProfile).mockRejectedValue(new Error('PROFILE_ALREADY_LINKED: conflict'));

    const response = await linkLinePost(new Request('http://localhost/api/account/link-line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-access-token-12345' })
    }));

    expect(response.status).toBe(409);
  });

  it('allows idempotent relink for same profile and same LINE account', async () => {
    vi.mocked(getSessionProfile).mockResolvedValue({
      profileId: 'profile-1',
      role: 'student',
      name: 'A',
      email: '',
      status: 'active',
      lastActiveAt: new Date().toISOString()
    });
    vi.mocked(verifyLineIdentity).mockResolvedValue({
      lineUserId: 'U-link-4',
      displayName: 'Line D'
    });
    vi.mocked(linkVerifiedLineToExistingProfile).mockResolvedValue({
      profileId: 'profile-1',
      lineUserId: 'U-link-4',
      displayName: 'Line D',
      pictureUrl: undefined
    });

    const response = await linkLinePost(new Request('http://localhost/api/account/link-line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-access-token-12345' })
    }));

    expect(response.status).toBe(200);
  });
});
