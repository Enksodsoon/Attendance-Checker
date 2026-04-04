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
  const accessToken = liff.getAccessToken() ?? undefined;
  const idToken = liff.getIDToken() ?? undefined;
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    statusMessage: profile.statusMessage,
    accessToken,
    idToken
  } satisfies LineProfile;
}
