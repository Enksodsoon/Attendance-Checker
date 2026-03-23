import type { Route } from 'next';
import Link from 'next/link';
import { AdminSectionShell } from '@/components/admin/admin-section-shell';
import { Card } from '@/components/ui/card';
import { demoAdminCourses } from '@/lib/services/demo-admin';

export default function AdminCoursesPage() {
  return (
    <AdminSectionShell
      eyebrow="Admin / course-section management"
      title="จัดการรายวิชาและตอนเรียน"
      description="รวมรายวิชา ห้องเรียน และอาจารย์ที่เกี่ยวข้องกับ session ใน MVP เพื่อให้ผู้ดูแลตรวจความสอดคล้องของโครงสร้างข้อมูลได้ทันที."
    >
      <div className="grid gap-4">
        {demoAdminCourses.map((course) => (
          <Card key={course.sectionId}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{course.semesterLabel}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{course.courseCode} · {course.courseNameTh}</h2>
                <p className="mt-2 text-sm text-slate-600">ตอน {course.sectionCode} · อาจารย์ {course.teacherName} · ห้อง {course.roomName}</p>
                <p className="mt-2 text-sm text-slate-600">นักศึกษาลงทะเบียน {course.enrolledCount} คน</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {course.activeSessionId ? (
                  <Link href={'/admin/sessions' as Route} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" style={{ color: "#ffffff" }}>
                    เปิด session oversight
                  </Link>
                ) : null}
                <Link href={'/teacher/sessions/demo-session' as Route} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  ดู teacher monitor
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AdminSectionShell>
  );
}
