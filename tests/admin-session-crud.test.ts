import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addAdminSession,
  deleteAdminSession,
  getAdminSessions,
  resetDemoState,
  updateAdminSession
} from '@/lib/services/app-data';

describe('admin session lifecycle', () => {
  beforeEach(() => {
    resetDemoState();
  });

  afterEach(() => {
    resetDemoState();
  });

  it('creates, updates, and deletes admin-managed sessions', () => {
    const initialCount = getAdminSessions().length;
    const created = addAdminSession({
      sectionId: 'cs401-sec1-2568',
      status: 'draft',
      allowManualApproval: true,
      window: {
        scheduledStartAt: '2026-04-01T09:00:00.000Z',
        scheduledEndAt: '2026-04-01T11:00:00.000Z',
        attendanceOpenAt: '2026-04-01T08:45:00.000Z',
        lateAfterAt: '2026-04-01T09:15:00.000Z',
        attendanceCloseAt: '2026-04-01T11:15:00.000Z'
      }
    });

    expect(created).toMatchObject({
      sectionId: 'cs401-sec1-2568',
      status: 'draft',
      allowManualApproval: true
    });
    expect(getAdminSessions()).toHaveLength(initialCount + 1);

    const updated = updateAdminSession({
      sessionId: created?.sessionId ?? '',
      status: 'open',
      allowManualApproval: false,
      window: {
        scheduledStartAt: '2026-04-01T09:30:00.000Z',
        scheduledEndAt: '2026-04-01T11:30:00.000Z',
        attendanceOpenAt: '2026-04-01T09:00:00.000Z',
        lateAfterAt: '2026-04-01T09:45:00.000Z',
        attendanceCloseAt: '2026-04-01T11:45:00.000Z'
      }
    });

    expect(updated).toMatchObject({
      sessionId: created?.sessionId,
      status: 'open',
      allowManualApproval: false
    });

    const removed = deleteAdminSession(created?.sessionId ?? '');
    expect(removed).toMatchObject({
      sessionId: created?.sessionId
    });
    expect(getAdminSessions()).toHaveLength(initialCount);
  });
});
