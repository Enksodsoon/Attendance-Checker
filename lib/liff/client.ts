'use client';

import liff from '@line/liff';
import type { LineProfile } from '@/lib/types';

let initialized = false;

export async function initializeLiff(liffId: string) {
  if (!initialized) {
    await liff.init({ liffId, withLoginOnExternalBrowser: true });
    initialized = true;
  }

  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }

  const profile = await liff.getProfile();
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    statusMessage: profile.statusMessage
  } satisfies LineProfile;
}

export async function getLiffAccessToken() {
  if (!initialized) {
    return null;
  }

  return liff.getAccessToken();
}
