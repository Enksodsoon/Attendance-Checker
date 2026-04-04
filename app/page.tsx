import Link from 'next/link';
import { getSessionProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const currentProfile = await getSessionProfile();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">Attendance Checker</span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">LINE attendance application</h1>
        <p className="mt-4 text-lg text-slate-600">Sign in with LINE to access your account and attendance tools.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Sign in</Link>
          <Link href="/liff" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Open LIFF</Link>
          {currentProfile ? <Link href="/account" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">My account</Link> : null}
          {currentProfile ? <a href="/api/auth/logout" className="rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700">Logout</a> : null}
        </div>

        {currentProfile ? (
          <p className="mt-6 text-sm text-slate-500">Signed in as {currentProfile.name} ({currentProfile.role})</p>
        ) : null}
      </section>

    </main>
  );
}
