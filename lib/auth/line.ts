import { getEnv } from '@/lib/config/env';

export interface VerifiedLineIdentity {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface VerifyLineIdentityInput {
  accessToken?: string;
  idToken?: string;
  claimedLineUserId?: string;
  claimedDisplayName?: string;
  claimedPictureUrl?: string;
  claimedStatusMessage?: string;
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

async function verifyWithAccessToken(accessToken: string) {
  const env = getEnv();
  const verifyBody = new URLSearchParams({ access_token: accessToken });

  const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: verifyBody.toString(),
    cache: 'no-store'
  });

  if (!verifyResponse.ok) {
    throw new Error('LINE access token verification failed');
  }

  const verifyPayload = (await verifyResponse.json()) as { client_id?: string };
  if (verifyPayload.client_id !== env.LINE_CHANNEL_ID) {
    throw new Error('LINE token was issued for a different channel');
  }

  const profileResponse = await fetch('https://api.line.me/v2/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: 'no-store'
  });

  if (!profileResponse.ok) {
    throw new Error('Unable to load LINE profile from access token');
  }

  const profilePayload = (await profileResponse.json()) as {
    userId?: string;
    displayName?: string;
    pictureUrl?: string;
    statusMessage?: string;
  };

  const lineUserId = normalizeText(profilePayload.userId);
  const displayName = normalizeText(profilePayload.displayName);

  if (!lineUserId || !displayName) {
    throw new Error('LINE profile response is missing required identity fields');
  }

  return {
    lineUserId,
    displayName,
    pictureUrl: normalizeText(profilePayload.pictureUrl),
    statusMessage: normalizeText(profilePayload.statusMessage)
  } satisfies VerifiedLineIdentity;
}

async function verifyWithIdToken(idToken: string) {
  const env = getEnv();
  const body = new URLSearchParams({
    id_token: idToken,
    client_id: env.LINE_CHANNEL_ID
  });

  const response = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString(),
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('LINE ID token verification failed');
  }

  const payload = (await response.json()) as {
    sub?: string;
    name?: string;
    picture?: string;
  };

  const lineUserId = normalizeText(payload.sub);
  const displayName = normalizeText(payload.name);

  if (!lineUserId || !displayName) {
    throw new Error('LINE ID token does not contain required identity claims');
  }

  return {
    lineUserId,
    displayName,
    pictureUrl: normalizeText(payload.picture)
  } satisfies VerifiedLineIdentity;
}

export async function verifyLineIdentity(input: VerifyLineIdentityInput): Promise<VerifiedLineIdentity> {
  const accessToken = normalizeText(input.accessToken);
  const idToken = normalizeText(input.idToken);

  if (!accessToken && !idToken) {
    throw new Error('LINE token is required');
  }

  let identity: VerifiedLineIdentity = accessToken ? await verifyWithAccessToken(accessToken) : await verifyWithIdToken(idToken!);

  if (!identity.pictureUrl && input.claimedPictureUrl) {
    identity = { ...identity, pictureUrl: normalizeText(input.claimedPictureUrl) };
  }

  if (!identity.statusMessage && input.claimedStatusMessage) {
    identity = { ...identity, statusMessage: normalizeText(input.claimedStatusMessage) };
  }

  const claimedUserId = normalizeText(input.claimedLineUserId);
  if (claimedUserId && claimedUserId !== identity.lineUserId) {
    throw new Error('LINE identity mismatch');
  }

  const claimedName = normalizeText(input.claimedDisplayName);
  if (claimedName && identity.displayName !== claimedName) {
    identity = { ...identity, displayName: claimedName };
  }

  return identity;
}
