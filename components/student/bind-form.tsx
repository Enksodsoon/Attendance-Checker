'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

type BindState = {
  studentCode: string;
  fullNameTh: string;
};

type BindResponse = {
  status: 'success';
  profileId: string;
  lineUserId: string;
  studentCode: string;
  fullNameTh: string;
};

export function BindForm() {
  const [form, setForm] = useState<BindState>({ studentCode: '6512345678', fullNameTh: 'สมชาย ใจดี' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BindResponse | null>(null);

  function updateField(key: keyof BindState, event: ChangeEvent<HTMLInputElement>) {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/student/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'ผูกบัญชีไม่สำเร็จ');
      }

      const payload = (await response.json()) as BindResponse;
      setResult(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'ผูกบัญชีไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <p className="text-sm text-slate-500">First-time binding</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">ผูก LINE กับรหัสนักศึกษา</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        หน้านี้ทำงานแบบ MVP แล้ว: กรอกข้อมูล, ส่งไปที่ API, และแสดงผลลัพธ์การ bind เพื่อให้ผู้ใช้รู้ว่าปุ่มทำอะไรและสำเร็จหรือไม่.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          รหัสนักศึกษา
          <input
            value={form.studentCode}
            onChange={(event) => updateField('studentCode', event)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="6512345678"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          ชื่อ-นามสกุล
          <input
            value={form.fullNameTh}
            onChange={(event) => updateField('fullNameTh', event)}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3"
            placeholder="สมชาย ใจดี"
          />
        </label>
        <button type="submit" className="inline-flex min-w-44 items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white" style={{ color: "#ffffff" }}>
          {submitting ? 'กำลังผูกบัญชี...' : 'ยืนยันการผูกบัญชี'}
        </button>
      </form>

      {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      {result ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <p className="font-semibold">ผูกบัญชีสำเร็จ</p>
          <p className="mt-2">รหัสนักศึกษา: {result.studentCode}</p>
          <p>ชื่อ: {result.fullNameTh}</p>
          <p>LINE User ID: {result.lineUserId}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/liff" className="rounded-full bg-emerald-700 px-4 py-2 font-medium text-white">
              กลับหน้า LIFF Home
            </Link>
            <Link href="/liff/check-in" className="rounded-full border border-emerald-300 px-4 py-2 font-medium text-emerald-800">
              ไปหน้าเช็กชื่อ
            </Link>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
