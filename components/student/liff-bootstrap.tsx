'use client';

import { useEffect, useRef, useState } from 'react';
import { initializeLiff } from '@/lib/liff/client';
import { LiffRegistrationForm } from '@/components/student/liff-registration-form';
import type { LineProfile, StudentIdentity } from '@/lib/types';

type SessionResponse = {
  status?: 'ok' | 'registration_required' | 'verification_failed';
  role?: 'student' | 'teacher' | 'admin' | 'super_admin';
  error?: string;
};

export function markBootstrapStartedOnce(startedRef: { current: boolean }) {
  if (startedRef.current) {
    return false;
  }
  startedRef.current = true;
  return true;
}

export function LiffBootstrap({ student, liffId }: Readonly<{ student?: StudentIdentity; liffId: string }>) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'signed_in' | 'registration_required' | 'error'>('idle');
  const [message, setMessage] = useState('กำลังเตรียม LIFF');
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    if (!markBootstrapStartedOnce(startedRef)) {
      return;
    }

    async function bootstrap() {
      if (student) {
        setStatus('signed_in');
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

        setLineProfile(profile);

        const response = await fetch('/api/liff/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            statusMessage: profile.statusMessage,
            accessToken: profile.accessToken,
            idToken: profile.idToken
          })
        });

        const json = (await response.json()) as SessionResponse;

        if (!response.ok && json.status !== 'registration_required') {
          setStatus('error');
          setMessage(json.error ?? 'เชื่อมต่อ LIFF ไม่สำเร็จ กรุณาลองใหม่');
          return;
        }

        if (json.status === 'registration_required') {
          setStatus('registration_required');
          setMessage('ยังไม่พบบัญชีนักศึกษา กรุณาลงทะเบียนใช้งานครั้งแรก');
          return;
        }

        if (json.role === 'admin' || json.role === 'super_admin') {
          setStatus('signed_in');
          setMessage('เชื่อมต่อสำเร็จ กำลังพาไปหน้าแอดมิน...');
          window.location.replace('/admin');
          return;
        }

        if (json.role === 'teacher') {
          setStatus('signed_in');
          setMessage('เชื่อมต่อสำเร็จ กำลังพาไปหน้าอาจารย์...');
          window.location.replace('/teacher/sessions');
          return;
        }

        setStatus('signed_in');
        setMessage('เชื่อมต่อสำเร็จ กำลังเข้าสู่ระบบ...');
        window.location.replace('/liff');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'เชื่อมต่อ LIFF ไม่สำเร็จ');
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [liffId, student]);

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
      <p className={`mt-3 rounded-xl px-3 py-2 ${status === 'error' ? 'bg-rose-50 text-rose-700' : status === 'registration_required' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{message}</p>

      {status === 'registration_required' && lineProfile ? <div className="mt-4"><LiffRegistrationForm identity={lineProfile} /></div> : null}
    </section>
  );
}
