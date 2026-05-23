import { useState } from 'react';
import { Link } from 'react-router-dom';
import logoUrl from '../assets/logo.svg';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="w-full sticky top-0 z-50 bg-neutral/90 backdrop-blur-md border-b border-neutral-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4">
          <img src={logoUrl} alt="Pink Halo Co." className="h-12 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-200">
          <Link to="/" className="hover:text-pink-300">Home</Link>
          <Link to="/?category=Men" className="hover:text-pink-300">Men</Link>
          <Link to="/?category=Women" className="hover:text-pink-300">Women</Link>
          <Link to="/?category=Children" className="hover:text-pink-300">Children</Link>
          <Link to="/?category=Pets" className="hover:text-pink-300">Pets</Link>
          <Link to="/admin" className="hover:text-pink-300">Admin</Link>
        </nav>

        <div className="md:hidden relative">
          <button
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className="text-gray-200 text-2xl"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-nav-menu md:hidden">
          <Link to="/" className="text-white py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/?category=Men" className="text-white py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMenuOpen(false)}>Men</Link>
          <Link to="/?category=Women" className="text-white py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMenuOpen(false)}>Women</Link>
          <Link to="/?category=Children" className="text-white py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMenuOpen(false)}>Children</Link>
          <Link to="/?category=Pets" className="text-white py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMenuOpen(false)}>Pets</Link>
          <Link to="/admin" className="text-white py-2 px-3 rounded-xl hover:bg-white/5" onClick={() => setMenuOpen(false)}>Admin</Link>
        </div>
      )}
    </header>
  );
}
