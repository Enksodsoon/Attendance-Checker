import Link from 'next/link';

export default function AuthForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Access forbidden</h1>
        <p className="mt-3 text-slate-600">Your account does not have permission for this area.</p>
        <div className="mt-6">
          <Link href="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Back to home</Link>
        </div>
      </section>
    </main>
  );
}
