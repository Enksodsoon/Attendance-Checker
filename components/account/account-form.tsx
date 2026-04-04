'use client';

import { FormEvent, useState } from 'react';
import { initializeLiff } from '@/lib/liff/client';

type AccountPayload = {
  profileId: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  fullNameTh: string;
  email: string;
  lineAccount: { lineUserId: string; displayName?: string; pictureUrl?: string } | null;
  student?: { studentCode: string; academicYear?: number; facultyName?: string };
  teacher?: { teacherCode: string; departmentName?: string };
};

export function AccountForm({ initial, liffId }: Readonly<{ initial: AccountPayload; liffId: string }>) {
  const [fullNameTh, setFullNameTh] = useState(initial.fullNameTh);
  const [email, setEmail] = useState(initial.email);
  const [academicYear, setAcademicYear] = useState(initial.student?.academicYear?.toString() ?? '');
  const [facultyName, setFacultyName] = useState(initial.student?.facultyName ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [lineAccount, setLineAccount] = useState(initial.lineAccount);
  const [linking, setLinking] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullNameTh,
        email,
        academicYear: initial.role === 'student' && academicYear ? Number(academicYear) : undefined,
        facultyName: initial.role === 'student' ? facultyName : undefined
      })
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(payload.error ?? 'Unable to update account');
      return;
    }

    setMessage('Account updated');
  }

  async function handleLinkLine() {
    setMessage(null);
    setLinking(true);
    try {
      const profile = await initializeLiff(liffId);
      if (!profile) {
        return;
      }

      const response = await fetch('/api/account/link-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: profile.accessToken,
          idToken: profile.idToken,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          statusMessage: profile.statusMessage
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        lineAccount?: { lineUserId: string; displayName?: string; pictureUrl?: string } | null;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to link LINE account');
      }

      setLineAccount(payload.lineAccount ?? null);
      setMessage('LINE account linked successfully');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to link LINE account');
    } finally {
      setLinking(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-6 grid gap-3">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Linked LINE (read-only)</p>
        {lineAccount ? (
          <div className="mt-1 space-y-1">
            <p>Display name: {lineAccount.displayName || '-'}</p>
            <p>LINE User ID: {lineAccount.lineUserId}</p>
            <p>Picture URL: {lineAccount.pictureUrl || '-'}</p>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <p>No LINE account linked</p>
            <button type="button" onClick={handleLinkLine} disabled={linking} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-60">
              {linking ? 'Linking LINE...' : 'Link LINE account'}
            </button>
          </div>
        )}
      </div>

      <label className="grid gap-1 text-sm">
        <span>Full name</span>
        <input value={fullNameTh} onChange={(event) => setFullNameTh(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2" required />
      </label>

      <label className="grid gap-1 text-sm">
        <span>Email</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="rounded-xl border border-slate-300 px-3 py-2" />
      </label>

      {initial.role === 'student' ? (
        <>
          <label className="grid gap-1 text-sm">
            <span>Academic year</span>
            <input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} inputMode="numeric" className="rounded-xl border border-slate-300 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>Faculty</span>
            <input value={facultyName} onChange={(event) => setFacultyName(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2" />
          </label>
        </>
      ) : null}

      <button type="submit" className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Save profile</button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
