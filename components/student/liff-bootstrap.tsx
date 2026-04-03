'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializeLiff } from '@/lib/liff/client';
import type { StudentIdentity } from '@/lib/types';

export function LiffBootstrap({ student, liffId }: Readonly<{ student?: StudentIdentity; liffId: string }>) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'connecting' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('กำลังเตรียม LIFF');

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (student) {
        setStatus('ready');
        setMessage('เชื่อมต่อบัญชี LINE แล้ว');
        return;
      }

      setStatus('connecting');
      setMessage('กำลังเชื่อมต่อ LINE...');

      try {
        const profile = await initializeLiff(liffId);
        if (!profile || cancelled) {
          return;
        }

        const response = await fetch('/api/liff/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId: profile.userId })
        });

        const json = (await response.json()) as { role?: 'student' | 'teacher' | 'admin' | 'super_admin'; error?: string };

        if (response.ok) {
          if (json.role === 'admin' || json.role === 'super_admin') {
            setStatus('ready');
            setMessage('เชื่อมต่อสำเร็จ กำลังพาไปหน้าแอดมิน...');
            router.replace('/admin');
            return;
          }

          if (json.role === 'teacher') {
            setStatus('ready');
            setMessage('เชื่อมต่อสำเร็จ กำลังพาไปหน้าอาจารย์...');
            router.replace('/teacher/sessions');
            return;
          }

          setStatus('ready');
          setMessage('เชื่อมต่อสำเร็จ กำลังโหลดข้อมูลนักศึกษา...');
          router.refresh();
          return;
        }

        setStatus('error');
        setMessage(json.error ?? 'บัญชี LINE นี้ยังไม่ถูกผูกกับนักศึกษา กรุณาให้ผู้ดูแลผูกบัญชีในระบบก่อน');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'เชื่อมต่อ LIFF ไม่สำเร็จ');
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [liffId, router, student]);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <p className="font-semibold text-slate-900">สถานะการเชื่อมต่อ LIFF</p>
      {student ? (
        <div className="mt-2 space-y-1 text-slate-600">
          <p>ชื่อ: {student.fullNameTh}</p>
          <p>รหัสนักศึกษา: {student.studentCode}</p>
          <p>LINE User ID: {student.lineUserId || 'ยังไม่ได้ bind'}</p>
        </div>
      ) : null}
      <p className={`mt-3 rounded-xl px-3 py-2 ${status === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{message}</p>
    </section>
  );
}
