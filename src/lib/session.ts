const CART_STORAGE_KEY = 'pink-halo-cart';
const SESSION_KEY = 'pink-halo-session-id';

function generateSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setCookie(name: string, value: string, days = 30) {
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60));
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function getCookie(name: string) {
  const prefix = `${name}=`;
  const match = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

export function ensureGuestSession() {
  let sessionId = localStorage.getItem(SESSION_KEY) || getCookie('pinkhalo_guest_session');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
    setCookie('pinkhalo_guest_session', sessionId, 30);
  }
  return sessionId;
}

export function loadGuestCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveGuestCart(cart: Record<string, number>) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  setCookie('pinkhalo_cart', btoa(JSON.stringify(cart)), 30);
}

export function clearGuestCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  setCookie('pinkhalo_cart', '', 0);
}
