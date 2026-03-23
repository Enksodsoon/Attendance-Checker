'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import type { AdminCourseSection, UserProfile } from '@/lib/types';

interface CourseResponse {
  items: AdminCourseSection[];
  teacherOptions: UserProfile[];
  roomOptions: Array<{ roomId: string; label: string }>;
}

export function CourseManagementPanel() {
  const [items, setItems] = useState<AdminCourseSection[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<UserProfile[]>([]);
  const [roomOptions, setRoomOptions] = useState<Array<{ roomId: string; label: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [form, setForm] = useState({ courseCode: '', courseNameTh: '', sectionCode: '', semesterLabel: 'ภาคการศึกษาที่ 2/2568', teacherProfileId: '', roomId: '', sessionStatus: 'draft' });

  function resetForm(nextTeacherProfileId = teacherOptions[0]?.profileId ?? '', nextRoomId = roomOptions[0]?.roomId ?? '') {
    setEditingSectionId(null);
    setForm({
      courseCode: '',
      courseNameTh: '',
      sectionCode: '',
      semesterLabel: 'ภาคการศึกษาที่ 2/2568',
      teacherProfileId: nextTeacherProfileId,
      roomId: nextRoomId,
      sessionStatus: 'draft'
    });
  }

  async function load() {
    const response = await fetch('/api/admin/courses', { cache: 'no-store' });
    const json = (await response.json()) as CourseResponse & { error?: string };
    if (!response.ok) throw new Error(json.error ?? 'โหลดรายวิชาไม่สำเร็จ');
    setItems(json.items);
    setTeacherOptions(json.teacherOptions);
    setRoomOptions(json.roomOptions);
    setForm((current) => ({
      ...current,
      teacherProfileId: current.teacherProfileId || json.teacherOptions[0]?.profileId || '',
      roomId: current.roomId || json.roomOptions[0]?.roomId || ''
    }));
  }

  useEffect(() => {
    load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'โหลดรายวิชาไม่สำเร็จ'));
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/courses', {
        method: editingSectionId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSectionId ? { ...form, sectionId: editingSectionId } : form)
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'บันทึกรายวิชาไม่สำเร็จ');
      resetForm();
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'บันทึกรายวิชาไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(sectionId: string) {
    setError(null);
    try {
      const response = await fetch(`/api/admin/courses?sectionId=${sectionId}`, { method: 'DELETE' });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? 'ลบรายวิชาไม่สำเร็จ');
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'ลบรายวิชาไม่สำเร็จ');
    }
  }

  function startEdit(item: AdminCourseSection) {
    setEditingSectionId(item.sectionId);
    setForm({
      courseCode: item.courseCode,
      courseNameTh: item.courseNameTh,
      sectionCode: item.sectionCode,
      semesterLabel: item.semesterLabel,
      teacherProfileId: item.teacherProfileId,
      roomId: item.roomId,
      sessionStatus: item.activeSessionId ? 'open' : 'draft'
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div><p className="text-sm text-slate-500">Create course/section</p><h2 className="text-2xl font-semibold text-slate-900">เพิ่มรายวิชา/ตอนเรียน</h2></div>
        <div className="grid gap-4 md:grid-cols-3">
          <input value={form.courseCode} onChange={(event) => setForm((current) => ({ ...current, courseCode: event.target.value }))} placeholder="รหัสวิชา" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.courseNameTh} onChange={(event) => setForm((current) => ({ ...current, courseNameTh: event.target.value }))} placeholder="ชื่อรายวิชา" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.sectionCode} onChange={(event) => setForm((current) => ({ ...current, sectionCode: event.target.value }))} placeholder="ตอน" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <input value={form.semesterLabel} onChange={(event) => setForm((current) => ({ ...current, semesterLabel: event.target.value }))} placeholder="ภาคการศึกษา" className="rounded-2xl border border-slate-300 px-4 py-3" />
          <select value={form.teacherProfileId} onChange={(event) => setForm((current) => ({ ...current, teacherProfileId: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3">
            {teacherOptions.map((teacher) => <option key={teacher.profileId} value={teacher.profileId}>{teacher.name}</option>)}
          </select>
          <select value={form.roomId} onChange={(event) => setForm((current) => ({ ...current, roomId: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3">
            {roomOptions.map((room) => <option key={room.roomId} value={room.roomId}>{room.label}</option>)}
          </select>
          <select value={form.sessionStatus} onChange={(event) => setForm((current) => ({ ...current, sessionStatus: event.target.value }))} className="rounded-2xl border border-slate-300 px-4 py-3">
            <option value="draft">draft</option>
            <option value="open">open</option>
            <option value="closed">closed</option>
          </select>
        </div>
        <button type="button" onClick={handleSubmit} disabled={submitting} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">{submitting ? 'กำลังบันทึก...' : editingSectionId ? 'อัปเดตรายวิชา' : 'เพิ่มรายวิชา'}</button>
        {editingSectionId ? (
          <button type="button" onClick={() => resetForm()} className="ml-3 inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">ยกเลิกการแก้ไข</button>
        ) : null}
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </Card>
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.sectionId}>
            <h3 className="text-xl font-semibold text-slate-900">{item.courseCode} · {item.courseNameTh}</h3>
            <p className="mt-2 text-sm text-slate-600">ตอน {item.sectionCode} · {item.teacherName} · {item.roomName}</p>
            <p className="mt-1 text-sm text-slate-500">{item.semesterLabel} · ลงทะเบียน {item.enrolledCount} คน · active session {item.activeSessionId ?? 'ยังไม่เปิด'}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => startEdit(item)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">แก้ไข</button>
              <button type="button" onClick={() => handleDelete(item.sectionId)} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">ลบ</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
