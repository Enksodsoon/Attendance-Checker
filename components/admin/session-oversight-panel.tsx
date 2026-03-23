'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import type { TeacherMonitorData, ManualApprovalQueueItem } from '@/lib/types';

interface SessionOverviewResponse {
  monitor: TeacherMonitorData;
  manualApprovalQueue: ManualApprovalQueueItem[];
  qrToken: string;
}

export function SessionOversightPanel() {
  const [data, setData] = useState<SessionOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyAttemptId, setBusyAttemptId] = useState<string | null>(null);

  async function load() {
    const response = await fetch('/api/admin/sessions/overview', { cache: 'no-store' });
    const json = (await response.json()) as SessionOverviewResponse;
    setData(json);
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'โหลด session overview ไม่สำเร็จ'));
  }, []);

  async function handleResolution(attemptId: string, status: 'approved' | 'rejected') {
    setBusyAttemptId(attemptId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/manual-approvals/${attemptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('อัปเดตคำขอไม่สำเร็จ');
      await load();
    } catch (resolutionError) {
      setError(resolutionError instanceof Error ? resolutionError.message : 'อัปเดตคำขอไม่สำเร็จ');
    } finally {
      setBusyAttemptId(null);
    }
  }

  async function refreshQr() {
    if (!data) return;
    setError(null);
    try {
      await fetch(`/api/teacher/sessions/${data.monitor.session.sessionId}/qr`, { method: 'POST' });
      await load();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'รีเฟรช QR ไม่สำเร็จ');
    }
  }

  if (!data) {
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
          </div>
          <button type="button" onClick={refreshQr} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" style={{ color: '#ffffff' }}>
            รีเฟรช QR token
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
    </div>
  );
}
