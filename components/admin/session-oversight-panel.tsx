'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import type { AdminSessionRecord, TeacherMonitorData, ManualApprovalQueueItem } from '@/lib/types';

interface SessionOverviewResponse {
  monitor: TeacherMonitorData | null;
  manualApprovalQueue: ManualApprovalQueueItem[];
  qrToken: string | null;
}

interface SessionManagementResponse {
  items: AdminSessionRecord[];
  sectionOptions: Array<{ sectionId: string; label: string }>;
}

function toDateTimeInputValue(value: string) {
  const date = new Date(value);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function toIsoValue(value: string) {
  return new Date(value).toISOString();
}

export function SessionOversightPanel() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SessionOverviewResponse | null>(null);
  const [sessionItems, setSessionItems] = useState<AdminSessionRecord[]>([]);
  const [sectionOptions, setSectionOptions] = useState<Array<{ sectionId: string; label: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyAttemptId, setBusyAttemptId] = useState<string | null>(null);
  const [submittingSession, setSubmittingSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const sessionId = searchParams.get('sessionId') ?? undefined;
  const [form, setForm] = useState({
    sectionId: '',
    status: 'draft',
    allowManualApproval: true,
    scheduledStartAt: '',
    scheduledEndAt: '',
    attendanceOpenAt: '',
    lateAfterAt: '',
    attendanceCloseAt: ''
  });

  const resetForm = useCallback((nextSectionId = sectionOptions[0]?.sectionId ?? '') => {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60_000);
    const end = new Date(start.getTime() + 2 * 60 * 60_000);
    setEditingSessionId(null);
    setForm({
      sectionId: nextSectionId,
      status: 'draft',
      allowManualApproval: true,
      scheduledStartAt: toDateTimeInputValue(start.toISOString()),
      scheduledEndAt: toDateTimeInputValue(end.toISOString()),
      attendanceOpenAt: toDateTimeInputValue(new Date(start.getTime() - 15 * 60_000).toISOString()),
      lateAfterAt: toDateTimeInputValue(new Date(start.getTime() + 15 * 60_000).toISOString()),
      attendanceCloseAt: toDateTimeInputValue(new Date(end.getTime() + 15 * 60_000).toISOString())
    });
  }, [sectionOptions]);

  const load = useCallback(async () => {
    const [overviewResponse, sessionsResponse] = await Promise.all([
      fetch(`/api/admin/sessions/overview${sessionId ? `?sessionId=${sessionId}` : ''}`, { cache: 'no-store' }),
      fetch('/api/admin/sessions', { cache: 'no-store' })
    ]);
    const overview = (await overviewResponse.json()) as SessionOverviewResponse & { error?: string };
    const sessions = (await sessionsResponse.json()) as SessionManagementResponse & { error?: string };
    if (!overviewResponse.ok) throw new Error(overview.error ?? 'โหลด session overview ไม่สำเร็จ');
    if (!sessionsResponse.ok) throw new Error(sessions.error ?? 'โหลดข้อมูล sessions ไม่สำเร็จ');
    setData(overview);
    setSessionItems(sessions.items);
    setSectionOptions(sessions.sectionOptions);
    setForm((current) => ({
      ...current,
      sectionId: current.sectionId || sessions.sectionOptions[0]?.sectionId || current.sectionId
    }));
  }, [sessionId]);

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'โหลด session overview ไม่สำเร็จ'));
  }, [load]);

  useEffect(() => {
    if (!form.scheduledStartAt || !form.scheduledEndAt) {
      resetForm();
    }
  }, [form.scheduledEndAt, form.scheduledStartAt, resetForm]);

  async function handleResolution(attemptId: string, status: 'approved' | 'rejected') {
    setBusyAttemptId(attemptId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/manual-approvals/${attemptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'อัปเดตคำขอไม่สำเร็จ');
      await load();
    } catch (resolutionError) {
      setError(resolutionError instanceof Error ? resolutionError.message : 'อัปเดตคำขอไม่สำเร็จ');
    } finally {
      setBusyAttemptId(null);
    }
  }

  async function handleSessionSubmit() {
    setSubmittingSession(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/sessions', {
        method: editingSessionId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: editingSessionId,
          sectionId: form.sectionId,
          status: form.status,
          allowManualApproval: form.allowManualApproval,
          window: {
            scheduledStartAt: toIsoValue(form.scheduledStartAt),
            scheduledEndAt: toIsoValue(form.scheduledEndAt),
            attendanceOpenAt: toIsoValue(form.attendanceOpenAt),
            lateAfterAt: toIsoValue(form.lateAfterAt),
            attendanceCloseAt: toIsoValue(form.attendanceCloseAt)
          }
        })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'บันทึก session ไม่สำเร็จ');
      resetForm(form.sectionId);
      await load();
    } catch (sessionError) {
      setError(sessionError instanceof Error ? sessionError.message : 'บันทึก session ไม่สำเร็จ');
    } finally {
      setSubmittingSession(false);
    }
  }

  async function handleSessionDelete(targetSessionId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/admin/sessions?sessionId=${targetSessionId}`, { method: 'DELETE' });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'ลบ session ไม่สำเร็จ');
      if (editingSessionId === targetSessionId) {
        resetForm();
      }
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'ลบ session ไม่สำเร็จ');
    }
  }

  async function refreshQr() {
    if (!data?.monitor) return;
    setError(null);
    try {
      const response = await fetch(`/api/teacher/sessions/${data.monitor.session.sessionId}/qr`, { method: 'POST' });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'รีเฟรช QR ไม่สำเร็จ');
      await load();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'รีเฟรช QR ไม่สำเร็จ');
    }
  }

  const sessionOptions = useMemo(() => sessionItems.map((item) => ({
    sessionId: item.sessionId,
    label: `${item.courseCode} / ตอน ${item.sectionCode} · ${item.status}`
  })), [sessionItems]);

  function startEditSession(item: AdminSessionRecord) {
    setEditingSessionId(item.sessionId);
    setForm({
      sectionId: item.sectionId,
      status: item.status,
      allowManualApproval: item.allowManualApproval,
      scheduledStartAt: toDateTimeInputValue(item.window.scheduledStartAt),
      scheduledEndAt: toDateTimeInputValue(item.window.scheduledEndAt),
      attendanceOpenAt: toDateTimeInputValue(item.window.attendanceOpenAt),
      lateAfterAt: toDateTimeInputValue(item.window.lateAfterAt),
      attendanceCloseAt: toDateTimeInputValue(item.window.attendanceCloseAt)
    });
  }

  if (!data?.monitor) {
    return <p className="text-sm text-slate-500">กำลังโหลด session overview...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Present" value={String(data.monitor.metrics.present)} helper="ผ่านทุกเงื่อนไข" />
        <StatCard label="Late" value={String(data.monitor.metrics.late)} helper="เช็กชื่อหลังเวลา late" />
        <StatCard label="Pending" value={String(data.monitor.metrics.pendingApproval)} helper="รอ admin/teacher review" />
        <StatCard label="Absent" value={String(data.monitor.metrics.absent)} helper="ยังไม่มี accepted record" />
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Active QR token</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{data.monitor.session.courseCode} · {data.monitor.session.courseNameTh}</h2>
            <p className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">QR token ล่าสุด: {data.qrToken}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sessionOptions.map((item) => (
                <a key={item.sessionId} href={`/admin/sessions?sessionId=${item.sessionId}`} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">{item.label}</a>
              ))}
            </div>
          </div>
          <button type="button" onClick={refreshQr} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            รีเฟรช QR token
          </button>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <p className="text-sm text-slate-500">Session management</p>
          <h2 className="text-2xl font-semibold text-slate-900">สร้าง / แก้ไขคาบเรียน</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <select value={form.sectionId} onChange={(event) => setForm((current) => ({ ...current, sectionId: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3">
            {sectionOptions.map((item) => <option key={item.sectionId} value={item.sectionId}>{item.label}</option>)}
          </select>
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3">
            <option value="draft">draft</option>
            <option value="open">open</option>
            <option value="closed">closed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.allowManualApproval} onChange={(event) => setForm((current) => ({ ...current, allowManualApproval: event.target.checked }))} />
            อนุญาต manual approval
          </label>
          <input type="datetime-local" value={form.scheduledStartAt} onChange={(event) => setForm((current) => ({ ...current, scheduledStartAt: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input type="datetime-local" value={form.scheduledEndAt} onChange={(event) => setForm((current) => ({ ...current, scheduledEndAt: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input type="datetime-local" value={form.attendanceOpenAt} onChange={(event) => setForm((current) => ({ ...current, attendanceOpenAt: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input type="datetime-local" value={form.lateAfterAt} onChange={(event) => setForm((current) => ({ ...current, lateAfterAt: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input type="datetime-local" value={form.attendanceCloseAt} onChange={(event) => setForm((current) => ({ ...current, attendanceCloseAt: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3" />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleSessionSubmit} disabled={submittingSession} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {submittingSession ? 'กำลังบันทึก...' : editingSessionId ? 'อัปเดตคาบเรียน' : 'สร้างคาบเรียน'}
          </button>
          <button type="button" onClick={() => resetForm()} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            รีเซ็ตฟอร์ม
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm text-slate-500">Manual approval queue</p><h2 className="text-2xl font-semibold text-slate-900">คำขอที่ต้องตรวจสอบ</h2></div>
          <button type="button" onClick={() => load()} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">โหลดข้อมูลใหม่</button>
        </div>
        {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        <div className="mt-4 space-y-4">
          {data.manualApprovalQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">ยังไม่มีคำขอใหม่</div>
          ) : data.manualApprovalQueue.map((item) => (
            <div key={item.attemptId} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.studentCode} · {item.fullNameTh}</p>
                  <p className="mt-1 text-sm text-slate-500">คำขอเมื่อ {new Date(item.requestedAt).toLocaleString('th-TH')}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{item.reasonText}</p>
                </div>
                <Badge tone={item.status === 'approved' ? 'teal' : item.status === 'rejected' ? 'red' : 'amber'}>{item.status}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => handleResolution(item.attemptId, 'approved')} disabled={busyAttemptId === item.attemptId} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">อนุมัติ</button>
                <button type="button" onClick={() => handleResolution(item.attemptId, 'rejected')} disabled={busyAttemptId === item.attemptId} className="rounded-full bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">ปฏิเสธ</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">All sessions</p>
            <h2 className="text-2xl font-semibold text-slate-900">รายการคาบเรียนทั้งหมด</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-4">
          {sessionItems.map((item) => (
            <div key={item.sessionId} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.courseCode} · ตอน {item.sectionCode}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.courseNameTh} · {item.teacherName} · {item.room.roomName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(item.window.scheduledStartAt).toLocaleString('th-TH')} - {new Date(item.window.scheduledEndAt).toLocaleString('th-TH')}
                  </p>
                </div>
                <Badge tone={item.status === 'open' ? 'teal' : item.status === 'draft' ? 'amber' : 'slate'}>{item.status}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={`/admin/sessions?sessionId=${item.sessionId}`} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">ดู overview</a>
                <button type="button" onClick={() => startEditSession(item)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">แก้ไข</button>
                <button type="button" onClick={() => handleSessionDelete(item.sessionId)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">ลบ</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
