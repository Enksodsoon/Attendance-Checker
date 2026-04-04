'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { UserProfile } from '@/lib/types';

export function SessionControls({ currentProfile }: Readonly<{ currentProfile: UserProfile | null }>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function logout() {
    setBusy(true);
    setError(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.refresh();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'ออกจากระบบไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          {currentProfile ? `บัญชีปัจจุบัน: ${currentProfile.name} (${currentProfile.role})` : 'ยังไม่ได้เข้าสู่ระบบ'}
        </span>
        {currentProfile ? (
          <button type="button" onClick={logout} className="rounded-full border border-slate-300 px-3 py-1 text-slate-700" disabled={busy}>
            {busy ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
