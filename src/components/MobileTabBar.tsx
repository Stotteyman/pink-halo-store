import { Link, useLocation } from 'react-router-dom';
import { useWishlist } from '../lib/wishlist';

type Tab = { to: string; label: string; icon: string; match: (p: string) => boolean };

const TABS: Tab[] = [
  { to: '/', label: 'Home', match: (p) => p === '/', icon: 'M3 11l9-8 9 8M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10' },
  { to: '/shop', label: 'Shop', match: (p) => p === '/shop' || p.startsWith('/category') || p === '/new', icon: 'M6 2l1.5 4h9L18 2M5 6h14l-1 14a1 1 0 01-1 1H7a1 1 0 01-1-1L5 6z' },
  { to: '/wishlist', label: 'Wishlist', match: (p) => p === '/wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { to: '/account', label: 'Account', match: (p) => p === '/account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

export default function MobileTabBar() {
  const { pathname } = useLocation();
  const wishlist = useWishlist();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-cream/95 backdrop-blur border-t border-hairline shadow-[0_-8px_30px_rgba(64,40,46,0.08)]">
      <div className="grid grid-cols-4">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link key={t.to} to={t.to} className={`flex flex-col items-center gap-1 py-2.5 transition-colors ${active ? 'text-rose' : 'text-ink-soft'}`}>
              <span className="relative">
                <svg className="w-6 h-6" fill={active && t.label === 'Wishlist' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
                </svg>
                {t.label === 'Wishlist' && wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose text-white text-[9px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{wishlist.length}</span>
                )}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em]">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
