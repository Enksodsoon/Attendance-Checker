import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { getSafeNext } from '@/lib/auth/safe-redirect';

function getReasonMessage() {
  return 'You need to sign in before opening Teacher or Admin Console.';
}

export default async function AuthRequiredPage({
  searchParams
}: Readonly<{ searchParams: Promise<{ next?: string; reason?: string }> }>) {
  const profile = await getSessionProfile();
  const params = await searchParams;
  const safeNext = getSafeNext(params.next, '/');
  const reasonMessage = getReasonMessage();
  const canBootstrapAdmin = Boolean(process.env.BOOTSTRAP_ADMIN_SECRET);

  if (profile && params.next && safeNext !== '/') {
    redirect(safeNext);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Sign-in required</h1>
        <p className="mt-3 text-slate-600">{reasonMessage}</p>
        <p className="mt-2 text-sm text-slate-500">Use LINE sign-in from the LIFF entry point.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Back to home</Link>
          <Link href="/liff" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Sign in with LINE</Link>
          {canBootstrapAdmin ? <Link href="/register/super-admin" className="w-full text-sm text-teal-700 underline underline-offset-4">Need first admin? Open setup page</Link> : null}
        </div>
      </section>
    </main>
  );
}
