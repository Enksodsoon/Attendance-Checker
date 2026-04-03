export default function OfflineAdminPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Emergency offline admin access</h1>
        <p className="mt-3 text-slate-600">Use this only as a temporary fallback when Supabase is unreachable.</p>

        <form action="/api/auth/offline-admin-login" method="post" className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span>Offline secret</span>
            <input name="secret" type="password" required className="rounded-xl border border-slate-300 px-3 py-2" />
          </label>
          <button type="submit" className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Enter admin console
          </button>
        </form>
      </section>
    </main>
  );
}
