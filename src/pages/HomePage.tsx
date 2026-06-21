import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../lib/types';
import { slugify, formatCurrency, truncate } from '../lib/utils';

interface HomePageProps {
  products: Product[];
}

export default function HomePage({ products }: HomePageProps) {
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl border border-pink-200 bg-white/80 p-8 sm:p-12 mb-12">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold text-pink-900 mb-4">Shop</h1>
            <p className="text-lg text-pink-700 mb-8 max-w-2xl">Handpicked items. Fast checkout. Quality guaranteed.</p>
            
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-3 border border-pink-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <Link
                  key={product.id}
                  to={`/${product.category.toLowerCase()}/${slugify(product.name)}`}
                  className="group border border-pink-100 rounded-2xl overflow-hidden hover:shadow-lg transition"
                >
                  <div className="bg-gray-100 h-56 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-pink-900 group-hover:text-pink-700 transition">
                      {product.name}
                    </h3>
                    <p className="text-sm text-pink-600 mt-1">
                      {truncate(product.description, 60)}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="font-bold text-pink-900">{formatCurrency(product.price)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.stock > 0 ? 'In Stock' : 'Out'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-pink-600 text-lg">No items found. Try a different search.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
