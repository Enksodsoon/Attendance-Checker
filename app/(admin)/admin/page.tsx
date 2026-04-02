import type { Route } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { requireSessionProfile } from '@/lib/auth/session';

const items: ReadonlyArray<{
  title: string;
  href: string;
  description: string;
}> = [
  {
    title: 'user management',
    href: '/admin/users' as Route,
    description: 'ดูสถานะบัญชี active, บทบาท, และลบบัญชีที่ไม่ต้องการใช้ต่อ'
  },
  {
    title: 'student registry',
    href: '/admin/students' as Route,
    description: 'เพิ่มนักศึกษาใหม่ พร้อมข้อมูลคณะ/ภาควิชา/ชั้นปี และดูการ bind LINE ปัจจุบัน'
  },
  {
    title: 'course/section management',
    href: '/admin/courses' as Route,
    description: 'สร้างรายวิชา ตอนเรียน กำหนดผู้สอน ห้อง และสถานะ session เริ่มต้น'
  },
  {
    title: 'enrollment management',
    href: '/admin/enrollments' as Route,
    description: 'ผูกนักศึกษากับตอนเรียน เพื่อให้ student/teacher flow ใช้ข้อมูลจริงเดียวกัน'
  },
  {
    title: 'room/geofence management',
    href: '/admin/rooms' as Route,
    description: 'ตรวจสอบพิกัดห้องเรียน รัศมี geofence และนโยบาย GPS'
  },
  {
    title: 'session oversight',
    href: '/admin/sessions' as Route,
    description: 'ติดตามคาบเรียนที่เปิดอยู่และคิวคำขอ manual approval'
  },
  {
    title: 'audit log viewer',
    href: '/admin/audit-logs' as Route,
    description: 'ดู audit log พร้อม filter ตาม action/entity/actor แบบอ่านง่ายขึ้น'
  },
  {
    title: 'export center',
    href: '/admin/exports' as Route,
    description: 'ดาวน์โหลด CSV/JSON และเปิด payload ที่หน้าอื่นใช้จริง'
  }
];

export const dynamic = 'force-dynamic';

export default async function AdminHomePage() {
  await requireSessionProfile(['admin', 'super_admin']);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <Card>
        <p className="text-sm text-slate-500">Admin home</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">แผงควบคุมผู้ดูแลระบบ</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          เวอร์ชันนี้ทำให้ admin workspace ใช้งานแบบปฏิบัติการได้มากขึ้น: จัดการบัญชี นักศึกษา การลงทะเบียน ห้อง รายวิชา session และ audit จากข้อมูลกลางเดียวกัน.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
            >
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="mt-2 leading-6 text-slate-600">{item.description}</p>
              <p className="mt-4 text-sm font-medium text-teal-700">เปิดส่วนจัดการ →</p>
            </Link>
          ))}
        </div>
      </Card>
    </main>
  );
}
