import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HaloWordmark } from './brand';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onToggleCart?: () => void;
}

const NAV: { label: string; to: string }[] = [
  { label: 'New In', to: '/new' },
  { label: 'Dresses', to: '/category/dresses' },
  { label: 'Tops', to: '/category/tops' },
  { label: 'Bottoms', to: '/category/bottoms' },
  { label: 'Sets', to: '/category/sets' },
  { label: 'Accessories', to: '/category/accessories' },
];

const ANNOUNCEMENTS = [
  'Free shipping on orders $75+',
  'Hassle-free 30-day returns',
  'Collection 01 — Made to Shine',
  'Earn rewards on every order',
];

export default function Header({ cartCount, wishlistCount, search, onSearchChange, onToggleCart }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate('/shop');
    setMobileOpen(false);
  }

  return (
    <>
      {/* Announcement marquee */}
      <div className="bg-rose text-[#FBF3EE] overflow-hidden whitespace-nowrap" aria-hidden="true">
        <div className="marquee-track py-2">
          {[0, 1].map((copy) => (
            <span key={copy} className="inline-flex">
              {ANNOUNCEMENTS.map((text) => (
                <span key={text} className="px-7 text-[10px] font-semibold uppercase tracking-[0.28em]">
                  {text} <span className="text-[#F3D9CE]">&nbsp;✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] xl:grid-cols-[1fr_auto_1fr] items-center h-[72px] gap-4">
            {/* Desktop nav */}
            <nav className="hidden xl:flex items-center gap-7">
              {NAV.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="nav-underline text-[11px] font-semibold uppercase tracking-[0.18em] text-ink whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/category/sale" className="nav-underline text-[11px] font-semibold uppercase tracking-[0.18em] text-rose whitespace-nowrap">
                Sale
              </Link>
            </nav>

            {/* Mobile hamburger */}
            <button className="xl:hidden p-2 -ml-2 text-ink" aria-label="Toggle menu" onClick={() => setMobileOpen((o) => !o)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>

            {/* Wordmark */}
            <div className="justify-self-center">
              <HaloWordmark textClassName="text-ink text-lg sm:text-xl" crestClassName="text-rose w-[72px] sm:w-[84px]" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-self-end gap-0.5 sm:gap-1.5">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen((o) => !o)}
                className="p-2 text-ink hover:text-rose transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
              </button>

              <Link to="/account" aria-label="Account" className="hidden sm:block p-2 text-ink hover:text-rose transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </Link>

              <Link to="/wishlist" aria-label="Wishlist" className="relative p-2 text-ink hover:text-rose transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-rose text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{wishlistCount}</span>
                )}
              </Link>

              <button type="button" onClick={onToggleCart} aria-label="Bag" className="relative p-2 text-ink hover:text-rose transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-rose text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">{cartCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expanding search bar */}
        {searchOpen && (
          <div className="border-t border-hairline bg-cream">
            <form onSubmit={submitSearch} className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
              <svg className="w-4 h-4 text-rose flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
              <input
                autoFocus
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search the collection..."
                className="flex-1 bg-transparent border-0 outline-none text-sm text-ink placeholder:text-ink-soft/70"
              />
              <button type="submit" className="text-[10px] font-semibold uppercase tracking-[0.24em] text-ink hover:text-rose transition-colors">
                Search
              </button>
              <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)} className="p-1 text-ink-soft hover:text-ink">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-hairline bg-cream px-4 pb-6">
            <form onSubmit={submitSearch} className="flex items-center gap-3 border-b border-ink/40 my-4 pb-2">
              <svg className="w-4 h-4 text-rose flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search the collection..."
                className="flex-1 bg-transparent border-0 outline-none text-sm text-ink placeholder:text-ink-soft/70"
              />
            </form>
            <nav className="flex flex-col">
              {NAV.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 border-b border-hairline text-[12px] font-semibold uppercase tracking-[0.18em] text-ink"
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/category/sale" onClick={() => setMobileOpen(false)} className="py-3 border-b border-hairline text-[12px] font-semibold uppercase tracking-[0.18em] text-rose">
                Sale
              </Link>
              <Link to="/account" onClick={() => setMobileOpen(false)} className="py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                My Account
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
