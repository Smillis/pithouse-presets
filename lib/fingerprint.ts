'use client';

// Generates a simple browser fingerprint from stable properties.
// Stored in localStorage so it persists across sessions.
// Not bulletproof, but appropriate for a community rating system.
export async function getFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';

  const stored = localStorage.getItem('ph_fp');
  if (stored) return stored;

  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    new Date().getTimezoneOffset(),
  ].join('|');

  // Simple hash using SubtleCrypto
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fp = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  localStorage.setItem('ph_fp', fp);
  return fp;
}
