'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DemoAccount, UserProfile } from '@/lib/types';

export function SessionControls({ currentProfile, accounts }: Readonly<{ currentProfile: UserProfile | null; accounts: DemoAccount[] }>) {
  const router = useRouter();
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function switchAccount(profileId: string) {
    setBusyProfileId(profileId);
    setError(null);
    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });
      if (!response.ok) {
        const json = (await response.json()) as { error?: string };
        throw new Error(json.error ?? 'สลับบัญชีไม่สำเร็จ');
      }
      router.refresh();
    } catch (switchError) {
      setError(switchError instanceof Error ? switchError.message : 'สลับบัญชีไม่สำเร็จ');
    } finally {
      setBusyProfileId(null);
    }
  }

  async function logout() {
    setBusyProfileId('logout');
    setError(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.refresh();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'ออกจากระบบไม่สำเร็จ');
    } finally {
      setBusyProfileId(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
          {currentProfile ? `บัญชีปัจจุบัน: ${currentProfile.name} (${currentProfile.role})` : 'ยังไม่ได้เลือกบัญชีทดลอง'}
        </span>
        {currentProfile ? (
          <button type="button" onClick={logout} className="rounded-full border border-slate-300 px-3 py-1 text-slate-700" disabled={busyProfileId === 'logout'}>
            ออกจากระบบ
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {accounts.map((account) => (
          <button
            key={account.profileId}
            type="button"
            onClick={() => switchAccount(account.profileId)}
            disabled={busyProfileId === account.profileId || account.status !== 'active'}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {busyProfileId === account.profileId
              ? 'กำลังสลับ...'
              : `${account.name} · ${account.role}${account.status !== 'active' ? ` · ${account.status}` : ''}`}
          </button>
        ))}
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
