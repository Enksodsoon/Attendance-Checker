export function isDevAuthEnabled() {
  // DEV-ONLY: bypasses are disabled by default and require explicit opt-in.
  return process.env.ALLOW_DEV_AUTH === 'true';
}

export function isSecureCookieRequired() {
  return process.env.NODE_ENV === 'production';
}
