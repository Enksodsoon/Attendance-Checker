import type { Route } from 'next';
import Link from 'next/link';
import { LiffBootstrap } from '@/components/student/liff-bootstrap';
import { HistoryList } from '@/components/student/history-list';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { getStudentDashboard } from '@/lib/services/app-data';

export const dynamic = 'force-dynamic';

const liffCheckInRoute: Route = '/liff/check-in';

export default function LiffHomePage() {
  const { student, activeSessions, summary, recentHistory } = getStudentDashboard();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <LiffBootstrap />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="มาเรียน" value={String(summary.totalPresent)} helper="ครั้ง" />
        <StatCard label="สาย" value={String(summary.totalLate)} helper="ครั้ง" />
        <StatCard label="รออนุมัติ" value={String(summary.totalPending)} helper="รายการ" />
        <StatCard label="ขาด" value={String(summary.totalAbsent)} helper="ครั้ง" />
      </section>

      <Card>
        <p className="text-sm text-slate-500">Home dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">สวัสดี {student.fullNameTh}</h1>
        <p className="mt-2 text-sm text-slate-600">รหัสนักศึกษา {student.studentCode} · บัญชี LINE พร้อมใช้งานกับข้อมูลจริงของคาบปัจจุบัน</p>
        <div className="mt-5 space-y-4">
          {activeSessions.map((session) => (
            <div key={session.sessionId} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{session.courseCode} · {session.courseNameTh}</p>
                  <p className="mt-1 text-sm text-slate-500">ตอน {session.sectionCode} · {session.room.roomName}</p>
                </div>
                <Link href={liffCheckInRoute} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" style={{ color: '#ffffff' }}>
                  เข้า flow เช็กชื่อ
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <HistoryList items={recentHistory} />
    </main>
  );
}
