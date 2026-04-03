export function getSafeNext(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  return value.startsWith('/') ? value : fallback;
}
