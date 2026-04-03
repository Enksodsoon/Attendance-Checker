export default function SuperAdminBootstrapPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Register first super admin</h1>
        <p className="mt-3 text-slate-600">
          One-time bootstrap page. Enter your LINE User ID and bootstrap secret to create/bind a super admin account.
        </p>

        <form action="/api/auth/bootstrap-super-admin" method="post" className="mt-6 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span>Bootstrap secret</span>
            <input name="secret" type="password" required className="rounded-xl border border-slate-300 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>LINE user ID</span>
            <input name="lineUserId" type="text" required className="rounded-xl border border-slate-300 px-3 py-2" placeholder="Uxxxxxxxx" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Full name (TH)</span>
            <input name="fullNameTh" type="text" required className="rounded-xl border border-slate-300 px-3 py-2" />
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
