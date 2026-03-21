'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { initializeLiff } from '@/lib/liff/client';
import type { LineProfile } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function LiffBootstrap() {
  const [profile, setProfile] = useState<LineProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('กำลังเชื่อมต่อ LINE LIFF...');

  useEffect(() => {
    async function bootstrap() {
      try {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
          setStatus('error');
          setMessage('ยังไม่ได้ตั้งค่า NEXT_PUBLIC_LIFF_ID');
          return;
        }

        const currentProfile = await initializeLiff(liffId);
        if (!currentProfile) {
          return;
        }

        setProfile(currentProfile);
        setStatus('ready');
        setMessage('พร้อมเช็กชื่อแล้ว');
      } catch (error) {
        console.error(error);
        setStatus('error');
        setMessage('เชื่อมต่อ LIFF ไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า LINE');
      }
    }

    void bootstrap();
  }, []);

  const tone = useMemo(() => {
    if (status === 'ready') return 'teal';
    if (status === 'error') return 'red';
    return 'amber';
  }, [status]);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">LIFF Bootstrap</p>
          <h2 className="text-2xl font-semibold text-slate-900">เริ่มต้นนักศึกษาภายใน LINE</h2>
        </div>
        <Badge tone={tone}>{message}</Badge>
      </div>
      <p className="text-sm leading-6 text-slate-600">
        ขั้นตอนแรกของ MVP คือ init LIFF, อ่าน LINE profile และพาไป binding/student dashboard โดยไม่เชื่อถือ student ID จาก client เพียงอย่างเดียว.
      </p>
      {profile ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <p>LINE Display Name: {profile.displayName}</p>
          <p>LINE User ID: {profile.userId}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3 text-sm font-medium">
        <Link href="/liff/bind" className="rounded-full bg-slate-900 px-4 py-2 text-white">
          ผูกบัญชีนักศึกษา
        </Link>
        <Link href="/liff/check-in" className="rounded-full border border-slate-300 px-4 py-2 text-slate-700">
          ไปหน้าเช็กชื่อ
        </Link>
      </div>
    </Card>
  );
}
