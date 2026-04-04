'use client';

import { FormEvent, useState } from 'react';
import { initializeLiff } from '@/lib/liff/client';

export function BootstrapSuperAdminForm({ liffId, next }: Readonly<{ liffId: string; next?: string }>) {
  const [secret, setSecret] = useState('');
  const [fullNameTh, setFullNameTh] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const profile = await initializeLiff(liffId);
      if (!profile) {
        return;
      }

      const response = await fetch('/api/auth/bootstrap-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          fullNameTh,
          email,
          next,
          accessToken: profile.accessToken,
          idToken: profile.idToken,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          statusMessage: profile.statusMessage
        })
      });

      const payload = (await response.json()) as { error?: string; redirectTo?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Bootstrap failed');
      }

      window.location.replace(payload.redirectTo || '/admin');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Bootstrap failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <label className="grid gap-1 text-sm">
        <span>Bootstrap secret</span>
        <input value={secret} onChange={(event) => setSecret(event.target.value)} type="password" required className="rounded-xl border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-1 text-sm">
        <span>Full name (TH)</span>
        <input value={fullNameTh} onChange={(event) => setFullNameTh(event.target.value)} type="text" className="rounded-xl border border-slate-300 px-3 py-2" placeholder="optional" />
      </label>
      <label className="grid gap-1 text-sm">
        <span>Email (optional)</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="rounded-xl border border-slate-300 px-3 py-2" />
      </label>
      <button type="submit" disabled={submitting} className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {submitting ? 'Bootstrapping...' : 'Create / bind super admin'}
      </button>
      {error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    </form>
  );
}
