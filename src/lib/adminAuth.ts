export const ADMIN_SESSION_COOKIE = 'noithathungngoc_admin_session';

export async function getAdminSessionValue(password: string) {
  const data = new TextEncoder().encode(`noithathungngoc-admin:${password}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function isAdminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}
