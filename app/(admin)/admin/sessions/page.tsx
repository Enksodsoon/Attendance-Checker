import type { Route } from 'next';
import Link from 'next/link';
import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { demoManualApprovalQueue } from '@/lib/services/demo-admin';
import { demoTeacherMonitor } from '@/lib/services/demo-data';

export default function AdminSessionsPage() {
  return (
    <AdminSectionShell
      eyebrow="Admin / session oversight"
      title="กำกับดูแลคาบเรียน"
      description="ผู้ดูแลสามารถตรวจดูคาบที่กำลังเปิดเช็กชื่ออยู่ สถานะภาพรวม และคิวคำขอ manual approval ที่ต้องตัดสินใจต่อในระบบจริง."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Present" value={String(demoTeacherMonitor.metrics.present)} helper="ผ่านทุกเงื่อนไข" />
        <StatCard label="Late" value={String(demoTeacherMonitor.metrics.late)} helper="เช็กชื่อหลังเวลา late" />
        <StatCard label="Pending" value={String(demoTeacherMonitor.metrics.pendingApproval)} helper="รอ admin/teacher review" />
        <StatCard label="Absent" value={String(demoTeacherMonitor.metrics.absent)} helper="ยังไม่มี accepted record" />
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Active session</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{demoTeacherMonitor.session.courseCode} · {demoTeacherMonitor.session.courseNameTh}</h2>
            <p className="mt-2 text-sm text-slate-600">ตอน {demoTeacherMonitor.session.sectionCode} · {demoTeacherMonitor.session.room.roomName} · {demoTeacherMonitor.session.teacherName}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={'/teacher/sessions/demo-session' as Route} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" style={{ color: "#ffffff" }}>
              เปิด live monitor
            </Link>
            <a href="/api/teacher/sessions/demo-session/export" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              ดาวน์โหลด CSV
            </a>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Manual approval queue</p>
            <h2 className="text-2xl font-semibold text-slate-900">คำขอที่ต้องตรวจสอบ</h2>
          </div>
          <Link href={'/admin/audit-logs' as Route} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            ดู audit log ประกอบ
          </Link>
        </div>
        <div className="mt-4 space-y-4">
          {demoManualApprovalQueue.map((item) => (
            <div key={item.attemptId} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.studentCode} · {item.fullNameTh}</p>
                  <p className="mt-1 text-sm text-slate-500">คำขอเมื่อ {new Date(item.requestedAt).toLocaleString('th-TH')}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{item.reasonText}</p>
                </div>
                <Badge tone="amber">{item.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AdminSectionShell>
  );
}
