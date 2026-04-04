import { getSafeNext } from '@/lib/auth/safe-redirect';
import { getEnv } from '@/lib/config/env';
import { BootstrapSuperAdminForm } from '@/components/admin/bootstrap-super-admin-form';

export default async function SuperAdminBootstrapPage({
  searchParams
}: Readonly<{ searchParams: Promise<{ reason?: string; next?: string }> }>) {
  const env = getEnv();
  const params = await searchParams;
  const safeNext = params.next ? getSafeNext(params.next, '/admin') : null;

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
          One-time bootstrap page. Use LIFF-verified LINE identity with the bootstrap secret to create/bind a super admin account.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          This is required for first-time setup when the connected Supabase project is empty or unseeded.
        </p>

        <BootstrapSuperAdminForm liffId={env.NEXT_PUBLIC_LIFF_ID} next={safeNext ?? undefined} />
      </section>
    </main>
  );
}
