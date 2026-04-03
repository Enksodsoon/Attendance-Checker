import { getSafeNext } from '@/lib/auth/safe-redirect';

export default async function SuperAdminBootstrapPage({
  searchParams
}: Readonly<{ searchParams: Promise<{ reason?: string; next?: string; lineUserId?: string }> }>) {
  const params = await searchParams;
  const safeNext = params.next ? getSafeNext(params.next, '/admin') : null;
  const initialLineUserId = params.lineUserId?.trim() ?? '';

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Register first super admin</h1>
        {params.reason === 'no-admin' ? (
          <p className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No admin account exists yet. Create the first super admin to unlock Admin Console.
          </p>
        ) : null}
        <p className="mt-3 text-slate-600">
          One-time bootstrap page. Enter your LINE User ID and bootstrap secret to create/bind a super admin account.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          This is required for first-time setup when the connected Supabase project is empty or unseeded.
        </p>

        <form action="/api/auth/bootstrap-super-admin" method="post" className="mt-6 grid gap-4">
          {safeNext ? <input name="next" type="hidden" value={safeNext} /> : null}
          <label className="grid gap-1 text-sm">
            <span>Bootstrap secret</span>
            <input name="secret" type="password" required className="rounded-xl border border-slate-300 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>LINE user ID</span>
            <input name="lineUserId" type="text" required className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Uxxxxxxxx" defaultValue={initialLineUserId} />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Full name (TH)</span>
            <input name="fullNameTh" type="text" className="rounded-xl border border-slate-300 px-3 py-2" placeholder="optional" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Email (optional)</span>
            <input name="email" type="email" className="rounded-xl border border-slate-300 px-3 py-2" />
          </label>
          <button type="submit" className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Create / bind super admin
          </button>
        </form>
      </section>
    </main>
  );
}
