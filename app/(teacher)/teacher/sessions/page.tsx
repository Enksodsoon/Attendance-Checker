import type { Route } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { demoTeacherMonitor } from '@/lib/services/demo-data';

const demoSessionRoute: Route = '/teacher/sessions/demo-session';

export default function TeacherSessionListPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <Card>
        <p className="text-sm text-slate-500">Teacher home / session list</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">คาบเรียนวันนี้</h1>
        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <p className="font-semibold text-slate-900">{demoTeacherMonitor.session.courseCode} · {demoTeacherMonitor.session.courseNameTh}</p>
          <p className="mt-1 text-sm text-slate-500">เปิดเช็กชื่ออยู่ที่ {demoTeacherMonitor.session.room.roomName}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={demoSessionRoute} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              เปิด live monitor
            </Link>
            <span className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700">
              create/edit session และ manual approval queue ต่อจากหน้านี้ได้
            </span>
          </div>
        </div>
      </Card>
    </main>
  );
}
