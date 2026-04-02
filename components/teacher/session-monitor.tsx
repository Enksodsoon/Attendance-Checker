'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import type { ManualApprovalQueueItem, TeacherMonitorData } from '@/lib/types';

const toneMap = {
  present: 'teal',
  late: 'amber',
  absent: 'red',
  pending_approval: 'amber',
  excused: 'slate',
  rejected: 'red'
} as const;

export function SessionMonitor({ data, qrDataUrl, manualApprovalQueue }: Readonly<{ data: TeacherMonitorData; qrDataUrl: string; manualApprovalQueue: ManualApprovalQueueItem[] }>) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: 'open' | 'closed') {
    setBusy(status);
    setError(null);
    try {
      const response = await fetch(`/api/teacher/sessions/${data.session.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('อัปเดตสถานะคาบเรียนไม่สำเร็จ');
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'อัปเดตสถานะคาบเรียนไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }

  async function refreshQr() {
    setBusy('qr');
    setError(null);
    try {
      const response = await fetch(`/api/teacher/sessions/${data.session.sessionId}/qr`, { method: 'POST' });
      if (!response.ok) throw new Error('รีเฟรช QR ไม่สำเร็จ');
      router.refresh();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'รีเฟรช QR ไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }

  async function resolveManualApproval(attemptId: string, status: 'approved' | 'rejected') {
    setBusy(`${status}:${attemptId}`);
    setError(null);
    try {
      const response = await fetch(`/api/admin/manual-approvals/${attemptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'อัปเดตคำขอ manual approval ไม่สำเร็จ');
      router.refresh();
    } catch (resolutionError) {
      setError(resolutionError instanceof Error ? resolutionError.message : 'อัปเดตคำขอ manual approval ไม่สำเร็จ');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">Open session live monitor</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {data.session.courseCode} / ตอน {data.session.sectionCode}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {data.session.courseNameTh} · {data.session.teacherName} · {data.session.room.roomName}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={data.session.status === 'open' ? 'teal' : 'red'}>สถานะ {data.session.status}</Badge>
            <Badge tone="slate">mode {data.session.attendanceMode}</Badge>
            <Badge tone="slate">verify {data.session.verificationMode}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setStatus('open')} disabled={busy !== null} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              เปิดคาบเรียน
            </button>
            <button type="button" onClick={() => setStatus('closed')} disabled={busy !== null} className="rounded-full bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
              ปิดคาบเรียน
            </button>
            <button type="button" onClick={refreshQr} disabled={busy !== null} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-60">
              รีเฟรช QR
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </div>
        <div className="rounded-3xl bg-slate-50 p-4 text-center">
          <Image src={qrDataUrl} alt="session qr" width={220} height={220} className="mx-auto rounded-2xl" unoptimized />
          <p className="mt-3 text-sm text-slate-500">แสดง QR สดสำหรับ session นี้ และหมุน token ได้จากปุ่มด้านซ้าย</p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Present" value={String(data.metrics.present)} helper="ผ่านทุกเงื่อนไข" />
        <StatCard label="Late" value={String(data.metrics.late)} helper="เกิน late_after_at" />
        <StatCard label="Pending" value={String(data.metrics.pendingApproval)} helper="รอ manual approval" />
        <StatCard label="Absent" value={String(data.metrics.absent)} helper="ยังไม่มี accepted record" />
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Roster with live statuses</p>
            <h2 className="text-2xl font-semibold text-slate-900">รายชื่อนักศึกษาแบบเรียลไทม์</h2>
          </div>
          <a
            href={`/api/teacher/sessions/${data.session.sessionId}/export`}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            ส่งออก CSV
          </a>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-4">รหัสนักศึกษา</th>
                <th className="py-3 pr-4">ชื่อ</th>
                <th className="py-3 pr-4">สถานะ</th>
                <th className="py-3 pr-4">เวลา</th>
                <th className="py-3 pr-4">ระยะ</th>
                <th className="py-3 pr-4">Accuracy</th>
                <th className="py-3 pr-4">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.roster.map((row) => (
                <tr key={row.studentId}>
                  <td className="py-3 pr-4 font-medium text-slate-900">{row.studentCode}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.fullNameTh}</td>
                  <td className="py-3 pr-4"><Badge tone={toneMap[row.status]}>{row.status}</Badge></td>
                  <td className="py-3 pr-4 text-slate-700">{row.checkedInAt ?? '-'}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.distanceM ? `${row.distanceM} m` : '-'}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.accuracyM ? `${row.accuracyM} m` : '-'}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.approvalStatus ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Manual approval queue</p>
            <h2 className="text-2xl font-semibold text-slate-900">คำขอที่ต้องตรวจสอบ</h2>
          </div>
          <button type="button" onClick={() => router.refresh()} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            โหลดข้อมูลใหม่
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {manualApprovalQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">ยังไม่มีคำขอใหม่</div>
          ) : manualApprovalQueue.map((item) => (
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
                <button
                  type="button"
                  onClick={() => resolveManualApproval(item.attemptId, 'approved')}
                  disabled={busy !== null}
                  className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  อนุมัติ
                </button>
                <button
                  type="button"
                  onClick={() => resolveManualApproval(item.attemptId, 'rejected')}
                  disabled={busy !== null}
                  className="rounded-full bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  ปฏิเสธ
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
