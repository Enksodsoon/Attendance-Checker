export function isDevAuthEnabled() {
  // DEV-ONLY: these bypasses must remain disabled in production runtime.
  if (process.env.ALLOW_DEV_AUTH === 'true') {
    return true;
  }

  if (process.env.VERCEL_ENV === 'preview') {
    return true;
  }

  return process.env.NODE_ENV !== 'production';
}

export function isSecureCookieRequired() {
  return process.env.NODE_ENV === 'production';
}
