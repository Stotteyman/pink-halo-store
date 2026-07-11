import { useState } from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  cartCount: number;
  onToggleCart?: () => void;
}

const CATEGORIES = ['Dresses', 'Tops', 'Lounge', 'Accessories'];

export default function Header({ cartCount, onToggleCart }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Announcement bar */}
      <div className="text-xs sm:text-sm text-center py-2 px-4 font-medium bg-[#831843] text-white">
        ✨ Free shipping on orders over $75 &nbsp;|&nbsp; Code <strong>HALO10</strong> — 10% off your first order ✨
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="flex flex-col leading-tight">
              <span className="text-[9px] uppercase tracking-[0.4em] font-semibold text-pink-400">
                Wear Your Halo
              </span>
              <span className="text-2xl font-serif font-bold text-[#831843]">Pink Halo</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-6 text-sm">
              <NavLink to="/shop">Shop All</NavLink>
              {CATEGORIES.map((cat) => (
                <NavLink key={cat} to={`/category/${cat.toLowerCase()}`}>{cat}</NavLink>
              ))}
              <Link to="/category/sale" className="font-semibold text-rose-600 hover:text-rose-700">
                Sale
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleCart}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-pink-100 text-[#831843] hover:bg-pink-200 transition-colors"
              >
                🛍️ Cart
                {cartCount > 0 && (
                  <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile toggle */}
              <button
                className="lg:hidden p-1.5 rounded-lg text-pink-700"
                aria-label="Toggle menu"
                onClick={() => setMobileOpen((o) => !o)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden px-4 pb-5 border-t border-pink-100">
            <nav className="flex flex-col gap-0.5 pt-3 text-sm">
              {[
                { to: '/shop', label: 'Shop All' },
                ...CATEGORIES.map((c) => ({ to: `/category/${c.toLowerCase()}`, label: c })),
                { to: '/category/sale', label: 'Sale 🏷️' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 px-3 rounded-lg text-pink-800 hover:bg-pink-50"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-pink-800 hover:text-[#831843] transition-colors">
      {children}
    </Link>
  );
}
