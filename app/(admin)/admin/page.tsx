import type { Route } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

const items: ReadonlyArray<{
  title: string;
  href: string;
  description: string;
}> = [
  {
    title: 'user management',
    href: '/admin/users' as Route,
    description: 'ดูสถานะบัญชี ผู้ใช้ที่ active และบทบาทของแต่ละโปรไฟล์'
  },
  {
    title: 'course/section management',
    href: '/admin/courses' as Route,
    description: 'ตรวจสอบรายวิชา ตอนเรียน อาจารย์ประจำวิชา และจำนวนนักศึกษาที่ลงทะเบียน'
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
    description: 'ดูบันทึกการกระทำล่าสุดผ่าน API ของฝั่งผู้ดูแลระบบ'
  },
  {
    title: 'export center',
    href: '/admin/exports' as Route,
    description: 'ดาวน์โหลด CSV/JSON จากระบบตัวอย่างและเปิด payload ที่หน้าอื่นใช้จริง'
  }
];

export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:px-6">
      <Card>
        <p className="text-sm text-slate-500">Admin home</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">แผงควบคุมผู้ดูแลระบบ</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          หน้านี้ถูกอัปเกรดจาก card แบบ static ให้เป็น admin workspace ที่กดเข้าแต่ละส่วนได้จริง พร้อมหน้าจอรายละเอียดสำหรับตรวจข้อมูลหลักของ MVP.
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
