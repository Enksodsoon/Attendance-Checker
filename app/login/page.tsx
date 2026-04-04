import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await getSessionProfile();

  if (session?.role === 'student') {
    redirect('/liff');
  }
  if (session?.role === 'teacher') {
    redirect('/teacher/sessions');
  }
  if (session?.role === 'admin' || session?.role === 'super_admin') {
    redirect('/admin');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-3 text-slate-600">This app uses LINE to sign in.</p>
        <div className="mt-6">
          <Link href="/liff" className="inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white">Continue with LINE</Link>
        </div>
      </section>
    </main>
  );
}
