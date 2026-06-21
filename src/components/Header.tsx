import { Link } from 'react-router-dom';

interface HeaderProps {
  cartCount: number;
}

export default function Header({ cartCount }: HeaderProps) {
  return (
    <header className="border-b border-pink-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4 sm:py-5">
        <Link to="/" className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-pink-500 font-semibold">Pink Halo</p>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-pink-900">Shop</h1>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden sm:flex gap-6 text-sm">
            <Link to="/" className="text-pink-700 hover:text-pink-900 transition">Home</Link>
          </nav>
          <Link to="/cart" className="flex items-center gap-2 px-4 py-2 bg-pink-100 hover:bg-pink-200 rounded-full transition">
            <span className="text-sm font-semibold text-pink-900">Cart</span>
            {cartCount > 0 && <span className="bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
