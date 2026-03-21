import crypto from 'node:crypto';
import QRCode from 'qrcode';

export interface SessionQrPayload {
  sessionId: string;
  token: string;
}

export function generateQrToken() {
  return crypto.randomBytes(24).toString('base64url');
}

export function encodeQrPayload(payload: SessionQrPayload) {
  return JSON.stringify(payload);
}

export function parseQrPayload(rawPayload: string): SessionQrPayload | null {
  try {
    const parsed = JSON.parse(rawPayload) as Partial<SessionQrPayload>;
    if (!parsed.sessionId || !parsed.token) {
      return null;
    }

    return {
      sessionId: parsed.sessionId,
      token: parsed.token
    };
  } catch {
    return null;
  }
}

export async function generateQrDataUrl(payload: SessionQrPayload) {
  return QRCode.toDataURL(encodeQrPayload(payload), {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320
  });
}
