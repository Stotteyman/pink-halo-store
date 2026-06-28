import { useState, useMemo, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../lib/types';
import { slugify, formatCurrency, truncate } from '../lib/utils';
import PinkHaloScene from '../components/three/PinkHaloScene';

interface HomePageProps {
  products: Product[];
}

const CATEGORIES = [
  { name: 'Dresses',     emoji: '👗', desc: 'From brunch to date night' },
  { name: 'Tops',        emoji: '✨', desc: 'Effortlessly elevated basics' },
  { name: 'Lounge',      emoji: '🤍', desc: 'Cozy-chic comfort sets' },
  { name: 'Accessories', emoji: '💛', desc: 'Finish the look' },
  { name: 'New Arrivals', emoji: '🌸', desc: 'Fresh drops just landed', link: '/new-arrivals' },
  { name: 'Sale',        emoji: '🏷️', desc: 'Boutique finds, better prices' },
];

function SceneLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0d0010]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-pink-300 text-sm tracking-widest uppercase">Loading Pink Halo</p>
      </div>
    </div>
  );
}

export default function HomePage({ products }: HomePageProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const filteredProducts = useMemo(() => {
    if (!search) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const newArrivals = products.slice(0, 4);
  const bestSellers = products.slice(4, 8);

  function handleCategoryClick(category: string) {
    navigate(`/category/${category.toLowerCase()}`);
  }

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email) setSubscribed(true);
  }

  function scrollToShop() {
    document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="flex-1">

      {/* ── 3D Hero Canvas ── */}
      <section className="relative w-full" style={{ height: '100vh' }}>
        <Suspense fallback={<SceneLoader />}>
          <PinkHaloScene onCategoryClick={handleCategoryClick} />
        </Suspense>

        {/* Overlay: scroll hint at bottom */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
          <p className="text-pink-200/70 text-xs uppercase tracking-[0.3em]">Click a category · Scroll to shop</p>
          <div className="w-0.5 h-8 bg-gradient-to-b from-pink-400/60 to-transparent animate-pulse" />
        </div>

        {/* Overlay: top-right CTA buttons */}
        <div className="absolute top-6 right-6 flex flex-col sm:flex-row gap-3 pointer-events-auto">
          <button
            onClick={scrollToShop}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-pink-400/40 text-white backdrop-blur-sm rounded-full text-sm font-medium transition"
          >
            Shop All
          </button>
          <Link
            to="/new-arrivals"
            className="px-5 py-2.5 bg-pink-600/80 hover:bg-pink-500 text-white backdrop-blur-sm rounded-full text-sm font-semibold transition shadow-lg shadow-pink-900/50"
          >
            New Arrivals ✨
          </Link>
        </div>

        {/* Overlay: bottom gradient fade into content */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#fff3ee] pointer-events-none" />
      </section>

      {/* ── Shop by Style ── */}
      <section id="shop-section" className="px-4 py-14 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-pink-400 mb-1">Explore</p>
          <h2 className="text-3xl font-serif font-bold text-pink-900">Shop by Style</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.name}
              to={cat.link ?? `/category/${cat.name.toLowerCase()}`}
              className="group flex flex-col items-center gap-2 p-5 rounded-2xl bg-white border border-pink-100 hover:border-pink-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-center"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="font-semibold text-pink-900 text-sm">{cat.name}</span>
              <span className="text-xs text-pink-500 leading-snug">{cat.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── New Arrivals ── */}
      {newArrivals.length > 0 && (
        <section className="px-4 py-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-pink-900">New Arrivals</h2>
            <Link to="/new-arrivals" className="text-sm text-pink-600 hover:text-pink-800 font-medium transition">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── Feature Banner ── */}
      <section className="px-4 py-10">
        <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, #2d0030 0%, #0d0010 70%)' }}>
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #ff4499 0%, transparent 50%)' }} />
          <div className="relative px-8 sm:px-14 py-14 text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-pink-300 mb-2">Wear Your Halo</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-3 max-w-lg">
              Every piece, curated for you.
            </h2>
            <p className="text-pink-200 mb-7 max-w-md">
              New feminine styles drop every week. Sign up to be the first to shop.
            </p>
            <Link
              to="/shop"
              className="inline-block px-8 py-3 bg-pink-500 hover:bg-pink-400 text-white rounded-full font-semibold transition shadow-lg shadow-pink-900/60"
            >
              Browse the Collection
            </Link>
          </div>
        </div>
      </section>

      {/* ── Best Sellers ── */}
      {bestSellers.length > 0 && (
        <section className="px-4 py-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-pink-900">Best Sellers</h2>
            <Link to="/shop" className="text-sm text-pink-600 hover:text-pink-800 font-medium transition">Shop all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── All Products / Search ── */}
      <section className="px-4 py-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-serif font-bold text-pink-900">All Products</h2>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-72 px-4 py-2.5 border border-pink-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm bg-white"
          />
        </div>
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🌸</p>
            <p className="text-pink-600 text-lg">No items found. Try a different search.</p>
          </div>
        )}
      </section>

      {/* ── Testimonials ── */}
      <section className="px-4 py-12 bg-pink-50/60">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-serif font-bold text-pink-900 mb-8">What Our Customers Say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { quote: 'The quality blew me away. I ordered two dresses and both fit perfectly.', name: 'Jasmine R.' },
              { quote: 'Fast shipping and the packaging was so pretty — felt like a gift to myself!', name: 'Maya T.' },
              { quote: 'Pink Halo is my go-to for anything elegant and feminine. Love this boutique.', name: 'Sophia K.' },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-pink-100 text-left shadow-sm">
                <p className="text-pink-400 text-lg mb-1">★★★★★</p>
                <p className="text-pink-800 text-sm italic mb-3">"{t.quote}"</p>
                <p className="text-pink-500 text-xs font-semibold">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Email Signup ── */}
      <section className="px-4 py-16 max-w-2xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-pink-400 mb-2">Join the Halo</p>
        <h2 className="text-3xl font-serif font-bold text-pink-900 mb-2">Get 10% off your first order</h2>
        <p className="text-pink-600 mb-7">Sign up for exclusive drops, style tips, and Halo Points rewards.</p>
        {subscribed ? (
          <p className="text-pink-700 font-semibold text-lg">✨ You're in! Welcome to the Halo. Check your email.</p>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 justify-center">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="flex-1 px-5 py-3 border border-pink-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm bg-white"
            />
            <button
              type="submit"
              className="px-7 py-3 bg-pink-900 hover:bg-pink-800 text-white rounded-full font-semibold transition whitespace-nowrap"
            >
              Join Now
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/${product.category.toLowerCase()}/${slugify(product.name)}`}
      className="group border border-pink-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white"
    >
      <div className="bg-gray-50 h-56 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <p className="text-xs text-pink-400 uppercase tracking-wider mb-1">{product.category}</p>
        <h3 className="font-semibold text-pink-900 group-hover:text-pink-600 transition leading-snug">
          {product.name}
        </h3>
        <p className="text-sm text-pink-500 mt-1">{truncate(product.description, 60)}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-pink-900">{formatCurrency(product.price)}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}>
            {product.stock > 0 ? 'In Stock' : 'Sold Out'}
          </span>
        </div>
      </div>
    </Link>
  );
}
