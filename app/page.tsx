import type { Route } from 'next';
import Link from 'next/link';
import { getDemoAccountSummaries, getSessionProfile } from '@/lib/auth/session';

const destinationByRole = {
  student: '/liff',
  teacher: '/teacher/sessions',
  admin: '/admin',
  super_admin: '/admin'
} satisfies Record<string, Route>;

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const currentProfile = await getSessionProfile();
  const demoAccounts = await getDemoAccountSummaries();

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
          Functional demo workspace
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          ระบบเช็กชื่อมหาวิทยาลัยผ่าน LINE LIFF + multi-role demo auth
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-600">
          เวอร์ชันนี้เน้นให้ flow หลักใช้งานได้จริงในสภาพแวดล้อมเดโม: เลือกบัญชีทดลอง, เข้าถึงข้อมูลตามบทบาท, เลือกคาบเรียน, เช็กชื่อ, ตรวจคำร้อง, และจัดการ master data.
        </p>
        {currentProfile ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">บัญชีปัจจุบัน</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{currentProfile.name}</p>
            <p className="mt-1 text-sm text-slate-600">{currentProfile.email} · {currentProfile.role}</p>
            <Link href={destinationByRole[currentProfile.role]} className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              ไปยัง workspace ของบทบาทนี้
            </Link>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {demoAccounts.map((account) => (
          <div key={account.profileId} className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{account.name}</h2>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-teal-700">{account.role}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{account.description}</p>
            <p className="mt-4 text-xs text-slate-500">{account.email}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
