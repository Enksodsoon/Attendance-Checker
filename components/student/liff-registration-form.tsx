'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LineProfile } from '@/lib/types';

type Props = {
  identity: LineProfile;
};

type RegistrationState = {
  fullNameTh: string;
  studentCode: string;
  email: string;
  academicYear: string;
  facultyName: string;
};

export function LiffRegistrationForm({ identity }: Readonly<Props>) {
  const router = useRouter();
  const [form, setForm] = useState<RegistrationState>({
    fullNameTh: identity.displayName,
    studentCode: '',
    email: '',
    academicYear: '',
    facultyName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarFallback = useMemo(() => identity.displayName.slice(0, 1).toUpperCase(), [identity.displayName]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/liff/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          academicYear: form.academicYear ? Number(form.academicYear) : undefined,
          lineUserId: identity.userId,
          displayName: identity.displayName,
          pictureUrl: identity.pictureUrl,
          statusMessage: identity.statusMessage,
          accessToken: identity.accessToken,
          idToken: identity.idToken
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Registration failed unexpectedly.');
      }

      router.replace('/liff');
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Registration failed unexpectedly.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <p className="font-semibold text-slate-900">ลงทะเบียนใช้งานครั้งแรก</p>
      <p className="mt-1 text-slate-600">บัญชี LINE นี้ยังไม่เคยลงทะเบียนนักศึกษา กรุณากรอกข้อมูลเพื่อเริ่มใช้งาน</p>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        {identity.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={identity.pictureUrl} alt="LINE profile" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">{avatarFallback}</div>
        )}
        <div>
          <p className="text-sm font-medium text-slate-900">{identity.displayName}</p>
          <p className="text-xs text-slate-500">LINE ID: {identity.userId}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <label className="grid gap-1 text-sm">
          <span>ชื่อ-นามสกุล</span>
          <input value={form.fullNameTh} onChange={(event) => setForm((current) => ({ ...current, fullNameTh: event.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" required />
        </label>

        <label className="grid gap-1 text-sm">
          <span>รหัสนักศึกษา</span>
          <input value={form.studentCode} onChange={(event) => setForm((current) => ({ ...current, studentCode: event.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" required />
        </label>

        <label className="grid gap-1 text-sm">
          <span>อีเมล (ไม่บังคับ)</span>
          <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} type="email" className="rounded-xl border border-slate-300 px-3 py-2" />
        </label>

        <label className="grid gap-1 text-sm">
          <span>ชั้นปี (ไม่บังคับ)</span>
          <input value={form.academicYear} onChange={(event) => setForm((current) => ({ ...current, academicYear: event.target.value }))} inputMode="numeric" className="rounded-xl border border-slate-300 px-3 py-2" />
        </label>

        <label className="grid gap-1 text-sm">
          <span>คณะ (ไม่บังคับ)</span>
          <input value={form.facultyName} onChange={(event) => setForm((current) => ({ ...current, facultyName: event.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2" />
        </label>

        <button type="submit" disabled={submitting} className="mt-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {submitting ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนและเข้าใช้งาน'}
        </button>
      </form>

      {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}
