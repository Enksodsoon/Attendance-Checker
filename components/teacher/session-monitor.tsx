import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import type { TeacherMonitorData } from '@/lib/types';

const toneMap = {
  present: 'teal',
  late: 'amber',
  absent: 'red',
  pending_approval: 'amber',
  excused: 'slate',
  rejected: 'red'
} as const;

export function SessionMonitor({ data, qrDataUrl }: Readonly<{ data: TeacherMonitorData; qrDataUrl: string }>) {
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
            <Badge tone="teal">สถานะ {data.session.status}</Badge>
            <Badge tone="slate">mode {data.session.attendanceMode}</Badge>
            <Badge tone="slate">verify {data.session.verificationMode}</Badge>
          </div>
        </div>
        <div className="rounded-3xl bg-slate-50 p-4 text-center">
          <Image src={qrDataUrl} alt="session qr" width={220} height={220} className="mx-auto rounded-2xl" unoptimized />
          <p className="mt-3 text-sm text-slate-500">QR payload หมุนได้ในอนาคตผ่าน session_qr_codes</p>
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
    </div>
  );
}
