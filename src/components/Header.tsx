import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  cartCount: number;
}

const CATEGORIES = ['Dresses', 'Tops', 'Lounge', 'Accessories', 'Sale'];

export default function Header({ cartCount }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-pink-900 text-white text-xs sm:text-sm text-center py-2 px-4">
        ✨ Free shipping on orders over $75 &nbsp;|&nbsp; Use code <strong>HALO10</strong> for 10% off your first order ✨
      </div>

      {/* Main Header */}
      <header className="border-b border-pink-100 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="flex flex-col leading-tight">
              <span className="text-[10px] uppercase tracking-[0.35em] text-pink-400 font-semibold">Wear Your Halo</span>
              <span className="text-2xl font-serif font-bold text-pink-900">Pink Halo</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6 text-sm">
              <Link to="/shop" className="text-pink-700 hover:text-pink-900 font-medium transition">Shop All</Link>
              <Link to="/new-arrivals" className="text-pink-700 hover:text-pink-900 transition">New Arrivals</Link>
              {CATEGORIES.filter(c => c !== 'Sale').map(cat => (
                <Link
                  key={cat}
                  to={`/category/${cat.toLowerCase()}`}
                  className="text-pink-700 hover:text-pink-900 transition"
                >
                  {cat}
                </Link>
              ))}
              <Link to="/category/sale" className="text-red-600 font-semibold hover:text-red-700 transition">Sale</Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link to="/about" className="hidden lg:block text-sm text-pink-600 hover:text-pink-900 transition">About</Link>
              <Link to="/contact" className="hidden lg:block text-sm text-pink-600 hover:text-pink-900 transition">Contact</Link>
              <Link to="/cart" className="flex items-center gap-1.5 px-4 py-2 bg-pink-100 hover:bg-pink-200 rounded-full transition text-sm font-semibold text-pink-900">
                🛍️ Cart
                {cartCount > 0 && (
                  <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Mobile menu button */}
              <button
                className="lg:hidden text-pink-700 hover:text-pink-900 p-1"
                onClick={() => setMobileMenuOpen(o => !o)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-pink-100 bg-white px-4 pb-4">
            <nav className="flex flex-col gap-1 pt-3 text-sm">
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="py-2 text-pink-800 font-semibold border-b border-pink-50">Shop All</Link>
              <Link to="/new-arrivals" onClick={() => setMobileMenuOpen(false)} className="py-2 text-pink-700 border-b border-pink-50">New Arrivals</Link>
              {CATEGORIES.filter(c => c !== 'Sale').map(cat => (
                <Link
                  key={cat}
                  to={`/category/${cat.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-pink-700 border-b border-pink-50"
                >
                  {cat}
                </Link>
              ))}
              <Link to="/category/sale" onClick={() => setMobileMenuOpen(false)} className="py-2 text-red-600 font-semibold border-b border-pink-50">Sale</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="py-2 text-pink-600 border-b border-pink-50">About</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="py-2 text-pink-600">Contact</Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
