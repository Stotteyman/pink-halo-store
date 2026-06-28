import { useState } from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  cartCount: number;
  dark?: boolean;
}

const CATEGORIES = ['Dresses', 'Tops', 'Lounge', 'Accessories', 'Sale'];

export default function Header({ cartCount, dark = false }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Announcement Bar */}
      <div className="text-xs sm:text-sm text-center py-2 px-4 font-medium"
        style={{
          background: dark ? 'rgba(255,30,100,0.18)' : '#831843',
          color: '#fff',
          backdropFilter: dark ? 'blur(12px)' : undefined,
          borderBottom: dark ? '1px solid rgba(255,80,160,0.2)' : undefined,
        }}>
        ✨ Free shipping on orders over $75 &nbsp;|&nbsp; Code <strong>HALO10</strong> — 10% off your first order ✨
      </div>

      {/* Main header */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: dark
            ? 'rgba(10,0,16,0.65)'
            : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: dark
            ? '1px solid rgba(255,80,160,0.18)'
            : '1px solid rgba(251,207,232,0.8)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">

            {/* Logo */}
            <Link to="/" className="flex flex-col leading-tight">
              <span className="text-[9px] uppercase tracking-[0.4em] font-semibold"
                style={{ color: dark ? 'rgba(255,160,200,0.7)' : '#f472b6' }}>
                Wear Your Halo
              </span>
              <span className="text-2xl font-serif font-bold"
                style={{
                  color: dark ? '#ffffff' : '#831843',
                  textShadow: dark ? '0 0 20px rgba(255,80,160,0.5)' : undefined,
                }}>
                Pink Halo
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-5 text-sm">
              <NavLink to="/shop" dark={dark}>Shop All</NavLink>
              <NavLink to="/new-arrivals" dark={dark}>New Arrivals</NavLink>
              {CATEGORIES.filter(c => c !== 'Sale').map(cat => (
                <NavLink key={cat} to={`/category/${cat.toLowerCase()}`} dark={dark}>{cat}</NavLink>
              ))}
              <Link to="/category/sale"
                className="font-semibold transition-all duration-200"
                style={{ color: dark ? '#ff8080' : '#e11d48' }}>
                Sale
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <NavLink to="/about" dark={dark} className="hidden lg:block text-sm">About</NavLink>
              <NavLink to="/contact" dark={dark} className="hidden lg:block text-sm">Contact</NavLink>

              <Link to="/cart"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300"
                style={{
                  background: dark ? 'rgba(255,95,160,0.25)' : 'rgba(252,231,243,0.9)',
                  border: dark ? '1px solid rgba(255,100,180,0.35)' : undefined,
                  color: dark ? '#fff' : '#831843',
                }}>
                🛍️ Cart
                {cartCount > 0 && (
                  <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile toggle */}
              <button
                className="lg:hidden p-1.5 rounded-lg transition"
                style={{ color: dark ? 'rgba(255,200,230,0.8)' : '#9d174d' }}
                onClick={() => setMobileOpen(o => !o)}
              >
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden px-4 pb-5"
            style={{ borderTop: dark ? '1px solid rgba(255,80,160,0.15)' : '1px solid rgba(251,207,232,0.6)' }}>
            <nav className="flex flex-col gap-0.5 pt-3 text-sm">
              {[
                { to: '/shop',          label: 'Shop All' },
                { to: '/new-arrivals',  label: 'New Arrivals' },
                ...CATEGORIES.filter(c => c !== 'Sale').map(c => ({ to: `/category/${c.toLowerCase()}`, label: c })),
                { to: '/category/sale', label: 'Sale 🏷️' },
                { to: '/about',         label: 'About' },
                { to: '/contact',       label: 'Contact' },
                { to: '/faq',           label: 'FAQ' },
              ].map(link => (
                <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                  className="py-2.5 px-3 rounded-lg transition"
                  style={{
                    color: dark ? 'rgba(255,200,230,0.85)' : '#9d174d',
                  }}>
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

function NavLink({ to, dark, children, className = '' }: {
  to: string; dark?: boolean; children: React.ReactNode; className?: string;
}) {
  return (
    <Link to={to} className={`transition-all duration-200 ${className}`}
      style={{ color: dark ? 'rgba(255,200,230,0.8)' : '#9d174d' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = dark ? '#fff' : '#831843'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = dark ? 'rgba(255,200,230,0.8)' : '#9d174d'; }}>
      {children}
    </Link>
  );
}
