// Simple guest wishlist stored in localStorage, with a live cross-component sync.
import { useEffect, useState } from 'react';

const KEY = 'pink-halo-wishlist';
const EVENT = 'pink-halo-wishlist-changed';

export function loadWishlist(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function save(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // ignore write failures (private mode, quota, etc.)
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function isWishlisted(id: string): boolean {
  return loadWishlist().includes(id);
}

export function toggleWishlist(id: string): boolean {
  const ids = loadWishlist();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  save(next);
  return next.includes(id);
}

export function removeFromWishlist(id: string) {
  save(loadWishlist().filter((x) => x !== id));
}

// React hook that stays in sync across components and tabs.
export function useWishlist(): string[] {
  const [ids, setIds] = useState<string[]>(() => (typeof window === 'undefined' ? [] : loadWishlist()));
  useEffect(() => {
    const sync = () => setIds(loadWishlist());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return ids;
}
