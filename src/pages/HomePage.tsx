import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../lib/types';
import { slugify, formatCurrency, truncate } from '../lib/utils';

interface HomePageProps {
  products: Product[];
}

const CATEGORIES = [
  { name: 'Dresses', emoji: '👗', desc: 'From brunch to date night' },
  { name: 'Tops', emoji: '✨', desc: 'Effortlessly elevated basics' },
  { name: 'Lounge', emoji: '🤍', desc: 'Cozy-chic comfort sets' },
  { name: 'Accessories', emoji: '💛', desc: 'Finish the look' },
  { name: 'New Arrivals', emoji: '🌸', desc: 'Fresh drops just landed', link: '/new-arrivals' },
  { name: 'Sale', emoji: '🏷️', desc: 'Boutique finds, better prices' },
];

export default function HomePage({ products }: HomePageProps) {
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

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email) setSubscribed(true);
  }

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative px-4 py-16 sm:py-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,160,200,0.18),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.4em] text-pink-500 font-semibold mb-3">Women's Boutique</p>
          <h1 className="text-5xl sm:text-7xl font-serif font-bold text-pink-900 mb-4 leading-tight">
            Wear Your<br />
            <span className="text-pink-500">Halo</span>
          </h1>
          <p className="text-lg text-pink-700 mb-8 max-w-xl mx-auto">
            Feminine, dreamy styles curated for the woman who knows how to shine. New arrivals every week.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/shop"
              className="px-8 py-3.5 bg-pink-900 hover:bg-pink-800 text-white rounded-full font-semibold transition shadow-lg hover:shadow-xl"
            >
              Shop All
            </Link>
            <Link
              to="/new-arrivals"
              className="px-8 py-3.5 border-2 border-pink-300 hover:border-pink-500 text-pink-900 rounded-full font-semibold transition"
            >
              New Arrivals
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="px-4 py-10 max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif font-bold text-pink-900 mb-6 text-center">Shop by Style</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.name}
              to={cat.link ?? `/category/${cat.name.toLowerCase()}`}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-pink-100 hover:border-pink-300 hover:shadow-md transition text-center"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="font-semibold text-pink-900 text-sm">{cat.name}</span>
              <span className="text-xs text-pink-500 leading-snug">{cat.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="px-4 py-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-pink-900">New Arrivals</h2>
            <Link to="/new-arrivals" className="text-sm text-pink-600 hover:text-pink-800 font-medium transition">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Banner */}
      <section className="px-4 py-10">
        <div className="max-w-7xl mx-auto rounded-3xl bg-pink-900 text-white p-8 sm:p-12 text-center">
          <p className="text-xs uppercase tracking-widest text-pink-300 mb-2">Limited Time</p>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-2">New drops every week.</h2>
          <p className="text-pink-200 mb-6">Be the first to know when your next favorite arrives.</p>
          <Link
            to="/shop"
            className="inline-block px-8 py-3 bg-white text-pink-900 hover:bg-pink-50 rounded-full font-semibold transition"
          >
            Browse the Collection
          </Link>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="px-4 py-10 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-pink-900">Best Sellers</h2>
            <Link to="/shop" className="text-sm text-pink-600 hover:text-pink-800 font-medium transition">
              Shop all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* All Products / Search */}
      <section className="px-4 py-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-serif font-bold text-pink-900">All Products</h2>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-72 px-4 py-2.5 border border-pink-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
          />
        </div>
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-pink-600 text-lg">No items found. Try a different search.</p>
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="px-4 py-12 bg-pink-50/60">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-serif font-bold text-pink-900 mb-8">What Our Customers Say</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { quote: "The quality blew me away. I ordered two dresses and both fit perfectly.", name: "Jasmine R." },
              { quote: "Fast shipping and the packaging was so pretty — felt like a gift to myself!", name: "Maya T." },
              { quote: "Pink Halo is my go-to for anything elegant and feminine. Love this boutique.", name: "Sophia K." },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-pink-100 text-left">
                <p className="text-pink-400 text-lg mb-1">★★★★★</p>
                <p className="text-pink-800 text-sm italic mb-3">"{t.quote}"</p>
                <p className="text-pink-600 text-xs font-semibold">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Signup */}
      <section className="px-4 py-14 max-w-2xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-pink-400 mb-2">Join the Halo</p>
        <h2 className="text-3xl font-serif font-bold text-pink-900 mb-2">Get 10% off your first order</h2>
        <p className="text-pink-600 mb-6">Sign up for exclusive drops, style tips, and Halo Points rewards.</p>
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
              className="flex-1 px-5 py-3 border border-pink-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-pink-900 hover:bg-pink-800 text-white rounded-full font-semibold transition whitespace-nowrap"
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
      className="group border border-pink-100 rounded-2xl overflow-hidden hover:shadow-lg transition bg-white"
    >
      <div className="bg-gray-50 h-56 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      </div>
      <div className="p-4">
        <p className="text-xs text-pink-400 uppercase tracking-wider mb-1">{product.category}</p>
        <h3 className="font-semibold text-pink-900 group-hover:text-pink-700 transition leading-snug">
          {product.name}
        </h3>
        <p className="text-sm text-pink-500 mt-1">{truncate(product.description, 60)}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-pink-900">{formatCurrency(product.price)}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {product.stock > 0 ? 'In Stock' : 'Sold Out'}
          </span>
        </div>
      </div>
    </Link>
  );
}
