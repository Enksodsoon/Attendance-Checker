'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { AdminCourseSection } from '@/lib/types';

export function CourseManagementPanel() {
  const [items, setItems] = useState<AdminCourseSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ courseCode: '', courseNameTh: '', sectionCode: '', semesterLabel: 'ภาคการศึกษาที่ 2/2568', teacherName: '', roomName: '', enrolledCount: '30' });

  async function load() {
    const response = await fetch('/api/admin/courses', { cache: 'no-store' });
    const json = (await response.json()) as { items: AdminCourseSection[] };
    setItems(json.items);
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'โหลดรายวิชาไม่สำเร็จ'));
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, enrolledCount: Number(form.enrolledCount) })
      });
      if (!response.ok) {
        throw new Error('บันทึกรายวิชาไม่สำเร็จ');
      }
      setForm({ courseCode: '', courseNameTh: '', sectionCode: '', semesterLabel: 'ภาคการศึกษาที่ 2/2568', teacherName: '', roomName: '', enrolledCount: '30' });
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'บันทึกรายวิชาไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div><p className="text-sm text-slate-500">Create course/section</p><h2 className="text-2xl font-semibold text-slate-900">เพิ่มรายวิชา/ตอนเรียน</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['courseCode', 'รหัสวิชา'], ['courseNameTh', 'ชื่อรายวิชา'], ['sectionCode', 'ตอน'], ['semesterLabel', 'ภาคการศึกษา'], ['teacherName', 'อาจารย์'], ['roomName', 'ห้อง'], ['enrolledCount', 'จำนวนนักศึกษา']
          ].map(([key, label]) => (
            <input key={key} value={form[key as keyof typeof form]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder={label} className="rounded-2xl border border-slate-300 px-4 py-3" />
          ))}
        </div>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white" style={{ color: '#ffffff' }}>{submitting ? 'กำลังบันทึก...' : 'เพิ่มรายวิชา'}</button>
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.sectionId}>
            <h3 className="text-xl font-semibold text-slate-900">{item.courseCode} · {item.courseNameTh}</h3>
            <p className="mt-2 text-sm text-slate-600">ตอน {item.sectionCode} · {item.teacherName} · {item.roomName}</p>
            <p className="mt-1 text-sm text-slate-500">{item.semesterLabel} · ลงทะเบียน {item.enrolledCount} คน</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
