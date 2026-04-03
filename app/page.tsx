import Link from 'next/link';
import { getSessionProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const currentProfile = await getSessionProfile();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">Production-ready entry</span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">ระบบเช็กชื่อมหาวิทยาลัยบน LINE LIFF + Supabase</h1>
        <p className="mt-4 text-lg text-slate-600">นักศึกษาเข้าใช้งานผ่าน LIFF ที่ /liff, ส่วนอาจารย์และแอดมินใช้งานผ่านเว็บด้วย Supabase Auth</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/liff" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">เปิดหน้า LIFF</Link>
          <Link href={process.env.NODE_ENV !== 'production' ? '/api/auth/dev-role-login?role=teacher&next=/teacher/sessions' : '/teacher/sessions'} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Teacher Console</Link>
          <Link href={process.env.NODE_ENV !== 'production' ? '/api/auth/dev-role-login?role=admin&next=/admin' : '/admin'} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Admin Console</Link>
          {process.env.NODE_ENV !== 'production' ? (
            <Link href="/api/auth/dev-admin-login" className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">DEV: เข้า Admin ทันที</Link>
          ) : null}
          {process.env.NODE_ENV !== 'production' ? (
            <p className="w-full text-xs text-amber-700">
              DEV: ผูก LINE กับแอดมินชั่วคราวได้ที่ <code>/api/auth/dev-admin-login?lineUserId=Uxxxxxxxx (ผูก LINE)</code>
            </p>
          ) : null}
        </div>

        {currentProfile ? (
          <p className="mt-6 text-sm text-slate-500">Signed in as {currentProfile.name} ({currentProfile.role})</p>
        ) : (
          <p className="mt-6 text-sm text-slate-500">ยังไม่มีเซสชัน ให้เข้าใช้งานจาก LINE LIFF หรือ Supabase Auth ก่อน</p>
        )}
      </section>
    </main>
  );
}
