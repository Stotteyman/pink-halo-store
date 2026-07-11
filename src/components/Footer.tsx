import { Link } from 'react-router-dom';

const CATEGORIES = ['Dresses', 'Tops', 'Lounge', 'Accessories'];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-pink-100 bg-pink-50 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
          {/* Brand */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-pink-400 font-semibold mb-0.5">Wear Your Halo</p>
            <h3 className="text-xl font-serif font-bold text-pink-900 mb-3">Pink Halo</h3>
            <p className="text-sm text-pink-600 leading-relaxed max-w-sm">
              A feminine, soft-glam boutique. Simple to shop, no account required — just add to bag and check out.
            </p>
            <div className="flex gap-3 text-pink-400 mt-4">
              <span title="Instagram" className="hover:text-pink-600 cursor-pointer text-lg">📸</span>
              <span title="TikTok" className="hover:text-pink-600 cursor-pointer text-lg">🎵</span>
              <span title="Pinterest" className="hover:text-pink-600 cursor-pointer text-lg">📌</span>
            </div>
          </div>

          {/* Shop */}
          <div className="sm:text-right">
            <h4 className="font-semibold text-pink-900 mb-3 text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm text-pink-600">
              <li><Link to="/shop" className="hover:text-pink-900 transition">Shop All</Link></li>
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link to={`/category/${cat.toLowerCase()}`} className="hover:text-pink-900 transition">{cat}</Link>
                </li>
              ))}
              <li><Link to="/category/sale" className="text-rose-500 hover:text-rose-700 font-medium transition">Sale</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-pink-100 pt-6 text-xs text-pink-400 text-center">
          <p>© {year} Pink Halo Co. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
