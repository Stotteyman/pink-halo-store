import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-pink-100 bg-white/80 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-pink-400 font-semibold mb-0.5">Wear Your Halo</p>
            <h3 className="text-xl font-serif font-bold text-pink-900 mb-3">Pink Halo</h3>
            <p className="text-sm text-pink-600 leading-relaxed">
              A women's clothing and lifestyle boutique. Feminine, dreamy, and boutique-focused — curated just for you.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-pink-900 mb-3 text-sm uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm text-pink-600">
              <li><Link to="/shop" className="hover:text-pink-900 transition">Shop All</Link></li>
              <li><Link to="/new-arrivals" className="hover:text-pink-900 transition">New Arrivals</Link></li>
              <li><Link to="/category/dresses" className="hover:text-pink-900 transition">Dresses</Link></li>
              <li><Link to="/category/tops" className="hover:text-pink-900 transition">Tops</Link></li>
              <li><Link to="/category/lounge" className="hover:text-pink-900 transition">Lounge</Link></li>
              <li><Link to="/category/accessories" className="hover:text-pink-900 transition">Accessories</Link></li>
              <li><Link to="/category/sale" className="text-red-500 hover:text-red-700 font-medium transition">Sale</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-semibold text-pink-900 mb-3 text-sm uppercase tracking-wider">Help</h4>
            <ul className="space-y-2 text-sm text-pink-600">
              <li><Link to="/faq" className="hover:text-pink-900 transition">FAQ</Link></li>
              <li><Link to="/shipping" className="hover:text-pink-900 transition">Shipping Info</Link></li>
              <li><Link to="/returns" className="hover:text-pink-900 transition">Returns & Exchanges</Link></li>
              <li><Link to="/size-guide" className="hover:text-pink-900 transition">Size Guide</Link></li>
              <li><Link to="/contact" className="hover:text-pink-900 transition">Contact Us</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-pink-900 mb-3 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm text-pink-600 mb-5">
              <li><Link to="/about" className="hover:text-pink-900 transition">About Pink Halo</Link></li>
              <li><Link to="/rewards" className="hover:text-pink-900 transition">Halo Points Rewards</Link></li>
            </ul>
            <h4 className="font-semibold text-pink-900 mb-2 text-sm uppercase tracking-wider">Follow Us</h4>
            <div className="flex gap-3 text-pink-400">
              <span title="Instagram" className="hover:text-pink-600 cursor-pointer text-lg">📸</span>
              <span title="TikTok" className="hover:text-pink-600 cursor-pointer text-lg">🎵</span>
              <span title="Pinterest" className="hover:text-pink-600 cursor-pointer text-lg">📌</span>
            </div>
          </div>
        </div>

        <div className="border-t border-pink-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-pink-400">
          <p>© {year} Pink Halo Co. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-pink-700 transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-pink-700 transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
