import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionProfile } from '@/lib/auth/session';
import { isDevAuthEnabled } from '@/lib/auth/dev-auth';
import { getSafeNext } from '@/lib/auth/safe-redirect';

function getReasonMessage(reason: string | undefined) {
  if (reason === 'no-admin') {
    return 'No admin account exists yet. Create the first super admin to continue.';
  }

  if (reason === 'no-teacher') {
    return 'No teacher profile is available for temporary dev login.';
  }

  return 'You need to sign in before opening Teacher or Admin Console.';
}

export default async function AuthRequiredPage({
  searchParams
}: Readonly<{ searchParams: Promise<{ next?: string; reason?: string }> }>) {
  const profile = await getSessionProfile();
  const params = await searchParams;
  const safeNext = getSafeNext(params.next, '/');
  const reasonMessage = getReasonMessage(params.reason);
  const devAuthEnabled = isDevAuthEnabled();

  if (profile && params.next && safeNext !== '/') {
    redirect(safeNext);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Sign-in required</h1>
        <p className="mt-3 text-slate-600">{reasonMessage}</p>
        <p className="mt-2 text-sm text-slate-500">First-time setup may require creating the first super admin account.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Back to home</Link>
          {params.next ? (
            <a href={safeNext} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Try target page again</a>
          ) : null}
          {devAuthEnabled ? (
            <>
              <Link href={`/api/auth/dev-role-login?role=teacher&next=${encodeURIComponent(params.next ? safeNext : '/teacher/sessions')}`} className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">DEV: Enter Teacher Console</Link>
              <Link href={`/api/auth/dev-role-login?role=admin&next=${encodeURIComponent(params.next ? safeNext : '/admin')}`} className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">DEV: Enter Admin Console</Link>
            </>
          ) : null}
          <a href="/register/super-admin" className="w-full text-sm text-teal-700 underline underline-offset-4">Need first account? Register super admin first</a>
          <a href="/register/offline-admin" className="w-full text-sm text-rose-700 underline underline-offset-4">Emergency fallback: offline admin login</a>
        </div>
      </section>
    </main>
  );
}
