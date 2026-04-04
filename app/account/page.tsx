import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AccountForm } from '@/components/account/account-form';
import { getEnv } from '@/lib/config/env';
import { getSessionProfile } from '@/lib/auth/session';
import { getAccountByProfileId } from '@/lib/services/db/accounts';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const env = getEnv();
  const session = await getSessionProfile();
  if (!session) {
    redirect('/login');
  }

  const account = await getAccountByProfileId(session.profileId);
  if (!account) {
    redirect('/login');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">My Account</h1>
        <p className="mt-2 text-sm text-slate-600">Role: {account.role}</p>
        {account.lineAccount ? (
          <p className="mt-1 text-sm text-slate-600">Linked LINE: {account.lineAccount.displayName || account.lineAccount.lineUserId}</p>
        ) : (
          <p className="mt-1 text-sm text-slate-600">Linked LINE: not linked</p>
        )}

        {account.student ? (
          <p className="mt-1 text-sm text-slate-600">Student code: {account.student.studentCode}</p>
        ) : null}
        {account.teacher ? (
          <p className="mt-1 text-sm text-slate-600">Teacher code: {account.teacher.teacherCode}</p>
        ) : null}

        <AccountForm initial={account} liffId={env.NEXT_PUBLIC_LIFF_ID} />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Back home</Link>
          <a href="/api/auth/logout" className="rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700">Logout</a>
        </div>
      </section>
    </main>
  );
}
