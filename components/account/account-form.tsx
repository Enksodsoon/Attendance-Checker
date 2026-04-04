'use client';

import { FormEvent, useState } from 'react';

type AccountPayload = {
  profileId: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin';
  fullNameTh: string;
  email: string;
  lineAccount: { lineUserId: string; displayName?: string; pictureUrl?: string } | null;
  student?: { studentCode: string; academicYear?: number; facultyName?: string };
  teacher?: { teacherCode: string; departmentName?: string };
};

export function AccountForm({ initial }: Readonly<{ initial: AccountPayload }>) {
  const [fullNameTh, setFullNameTh] = useState(initial.fullNameTh);
  const [email, setEmail] = useState(initial.email);
  const [academicYear, setAcademicYear] = useState(initial.student?.academicYear?.toString() ?? '');
  const [facultyName, setFacultyName] = useState(initial.student?.facultyName ?? '');
  const [message, setMessage] = useState<string | null>(null);

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

  return (
    <form onSubmit={save} className="mt-6 grid gap-3">
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
