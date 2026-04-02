import type { Route } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { requireSessionProfile } from '@/lib/auth/session';
import { getTeacherSessions } from '@/lib/services/app-data';

export const dynamic = 'force-dynamic';

export default async function TeacherSessionListPage() {
  const profile = await requireSessionProfile(['teacher', 'admin', 'super_admin']);
  const sessions = getTeacherSessions(profile.role === 'teacher' ? profile.profileId : 'profile-teacher-01');

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <Card>
        <p className="text-sm text-slate-500">Teacher home / session list</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">คาบเรียนของผู้สอน</h1>
        <div className="mt-6 space-y-4">
          {sessions.map((session) => (
            <div key={session.sessionId} className="rounded-2xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-900">{session.courseCode} · {session.courseNameTh}</p>
              <p className="mt-1 text-sm text-slate-500">ตอน {session.sectionCode} · {session.room.roomName} · สถานะ {session.status}</p>
              <p className="mt-2 text-sm text-slate-600">present {session.metrics.present} · late {session.metrics.late} · pending {session.metrics.pendingApproval} · absent {session.metrics.absent}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/teacher/sessions/${session.sessionId}` as Route} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                  เปิด live monitor
                </Link>
                <Link href={`/admin/sessions?sessionId=${session.sessionId}` as Route} className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700">
                  เปิด manual approval queue
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </main>
  );
}
