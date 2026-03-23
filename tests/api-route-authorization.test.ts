import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '@/lib/types';

vi.mock('@/lib/auth/session', () => ({
  getSessionProfile: vi.fn(),
  SESSION_COOKIE: 'attendance_demo_session'
}));

vi.mock('@/lib/services/app-data', () => ({
  getProfile: vi.fn(),
  getTeacherMonitorData: vi.fn(),
  isTeacherAssignedToSession: vi.fn(),
  canManageManualApprovalRequest: vi.fn(),
  resolveManualApprovalRequest: vi.fn()
}));

vi.mock('@/lib/services/audit-log', () => ({
  writeAuditLog: vi.fn()
}));

vi.mock('@/lib/utils/api', () => ({
  readValidatedJson: vi.fn()
}));

import { POST as demoLoginPost } from '@/app/api/auth/demo-login/route';
import { POST as manualApprovalDecisionPost } from '@/app/api/admin/manual-approvals/[attemptId]/route';
import { GET as teacherMonitorGet } from '@/app/api/teacher/sessions/[sessionId]/monitor/route';
import { getSessionProfile } from '@/lib/auth/session';
import { canManageManualApprovalRequest, getProfile, isTeacherAssignedToSession } from '@/lib/services/app-data';
import { readValidatedJson } from '@/lib/utils/api';

const teacherProfile: UserProfile = {
  profileId: 'profile-teacher-02',
  name: 'Teacher Two',
  email: 'teacher2@university.ac.th',
  role: 'teacher',
  status: 'active',
  lastActiveAt: new Date().toISOString(),
  teacherId: 'teacher-02'
};

describe('route authorization', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects demo login for suspended accounts', async () => {
    vi.mocked(readValidatedJson).mockResolvedValue({
      success: true,
      data: { profileId: 'profile-suspended-01' }
    });
    vi.mocked(getProfile).mockReturnValue({
      profileId: 'profile-suspended-01',
      name: 'Suspended User',
      email: 'suspended@university.ac.th',
      role: 'student',
      status: 'suspended',
      lastActiveAt: new Date().toISOString()
    });

    const response = await demoLoginPost(new Request('http://localhost/api/auth/demo-login', { method: 'POST' }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: 'บัญชีนี้ไม่สามารถเข้าใช้งานได้ในขณะนี้'
    });
  });

  it('returns 403 when a teacher requests another teacher session monitor', async () => {
    vi.mocked(getSessionProfile).mockResolvedValue(teacherProfile);
    vi.mocked(isTeacherAssignedToSession).mockReturnValue(false);

    const response = await teacherMonitorGet(new Request('http://localhost/api/teacher/sessions/cs401-sec1-open/monitor'), {
      params: Promise.resolve({ sessionId: 'cs401-sec1-open' })
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: 'Forbidden' });
  });

  it('returns 403 when a teacher tries to resolve another teacher manual approval request', async () => {
    vi.mocked(getSessionProfile).mockResolvedValue(teacherProfile);
    vi.mocked(canManageManualApprovalRequest).mockReturnValue(false);

    const response = await manualApprovalDecisionPost(new Request('http://localhost/api/admin/manual-approvals/attempt-123', { method: 'POST' }), {
      params: Promise.resolve({ attemptId: 'attempt-123' })
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: 'Forbidden' });
  });
});
