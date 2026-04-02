'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { AdminStudentRecord, EnrollmentRecord } from '@/lib/types';

interface EnrollmentResponse {
  items: EnrollmentRecord[];
  students: AdminStudentRecord[];
  sections: Array<{ sectionId: string; label: string }>;
}

export function EnrollmentManagementPanel() {
  const [data, setData] = useState<EnrollmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ studentId: '', sectionId: '' });

  async function load() {
    const response = await fetch('/api/admin/enrollments', { cache: 'no-store' });
    const json = (await response.json()) as EnrollmentResponse & { error?: string };
    if (!response.ok) throw new Error(json.error ?? 'โหลดข้อมูล enrollment ไม่สำเร็จ');
    setData(json);
    setForm((current) => ({
      studentId: current.studentId || json.students[0]?.studentId || '',
      sectionId: current.sectionId || json.sections[0]?.sectionId || ''
    }));
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'โหลดข้อมูล enrollment ไม่สำเร็จ'));
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'บันทึก enrollment ไม่สำเร็จ');
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'บันทึก enrollment ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(enrollmentId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/admin/enrollments?enrollmentId=${enrollmentId}`, { method: 'DELETE' });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'ลบ enrollment ไม่สำเร็จ');
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'ลบ enrollment ไม่สำเร็จ');
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div>
          <p className="text-sm text-slate-500">Create enrollment</p>
          <h2 className="text-2xl font-semibold text-slate-900">ผูกนักศึกษากับตอนเรียน</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select value={form.studentId} onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3">
            {data?.students.map((student) => <option key={student.studentId} value={student.studentId}>{student.studentCode} · {student.fullNameTh}</option>)}
          </select>
          <select value={form.sectionId} onChange={(event) => setForm((current) => ({ ...current, sectionId: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3">
            {data?.sections.map((section) => <option key={section.sectionId} value={section.sectionId}>{section.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">{submitting ? 'กำลังบันทึก...' : 'เพิ่ม enrollment'}</button>
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </Card>

      <Card>
        <p className="text-sm text-slate-500">Current enrollments</p>
        <h2 className="text-2xl font-semibold text-slate-900">รายการลงทะเบียนเรียน</h2>
        <div className="mt-4 space-y-3">
          {data?.items.map((item) => {
            const student = data.students.find((entry) => entry.studentId === item.studentId);
            const section = data.sections.find((entry) => entry.sectionId === item.sectionId);
            return (
              <div key={item.enrollmentId} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{student?.studentCode} · {student?.fullNameTh}</p>
                    <p className="mt-1 text-sm text-slate-500">{section?.label}</p>
                  </div>
                  <button type="button" onClick={() => handleDelete(item.enrollmentId)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">ลบ</button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
