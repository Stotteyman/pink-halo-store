import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Product } from '../lib/types';
import NotFound from './NotFound';

type Props = {
  products: Product[];
  onAdd: (product: Product, quantity: number) => void;
  setCartOpen: (open: boolean) => void;
  formatCurrency: (value: number) => string;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ProductDetail({ products, onAdd, setCartOpen, formatCurrency }: Props) {
  const params = useParams<{ category: string; slug: string }>();
  const categoryParam = params.category?.toLowerCase() ?? '';
  const slug = params.slug ?? '';
  const [quantity, setQuantity] = useState(1);

  const product = products.find(
    (item) => item.category.toLowerCase() === categoryParam && slugify(item.name) === slug
  );

  if (!product) {
    return <NotFound />;
  }

  const handleQuantityChange = (next: number) => {
    const clamped = Math.max(1, Math.min(product.stock, next));
    setQuantity(clamped);
  };

  return (
    <section className="min-h-screen bg-white text-pink-900 py-12">
      <div className="max-w-6xl mx-auto px-4 grid gap-10 lg:grid-cols-2 items-start">
        <div className="rounded-[2rem] overflow-hidden border border-pink-100 shadow-lg bg-pink-50">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(event) => {
              const target = event.currentTarget as HTMLImageElement;
              target.onerror = null;
              target.src =
                'data:image/svg+xml;charset=UTF-8,' +
                encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="100%" height="100%" fill="%23FBE6EE"/><text x="50%" y="50%" fill="%23DD5A8A" font-family="Inter,sans-serif" font-size="40" dominant-baseline="middle" text-anchor="middle">Image unavailable</text></svg>`
                );
            }}
          />
        </div>

        <div className="space-y-8 rounded-[2rem] border border-pink-100 bg-white p-8 shadow-lg">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-pink-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-pink-600">
              {product.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight text-pink-900">
              {product.name}
            </h1>
            <p className="text-base text-pink-600 max-w-2xl">{product.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-end gap-4">
              <span className="text-4xl font-serif font-bold text-pink-700">
                {formatCurrency(product.price)}
              </span>
              <span className="text-sm text-pink-400">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-3 rounded-full border border-pink-200 bg-pink-50 p-2 w-fit">
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="h-11 w-11 rounded-full border border-pink-200 bg-white text-lg font-semibold text-pink-700 transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(event) => handleQuantityChange(Number(event.target.value) || 1)}
                className="w-16 bg-transparent text-center text-lg font-semibold text-pink-900 outline-none"
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= product.stock}
                className="h-11 w-11 rounded-full border border-pink-200 bg-white text-lg font-semibold text-pink-700 transition hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="luxury-cta-gradient text-white font-semibold rounded-full px-6 py-4 shadow-lg hover:shadow-xl transition"
              onClick={() => {
                onAdd(product, quantity);
                setCartOpen(true);
              }}
              disabled={product.stock <= 0}
            >
              {product.stock > 0 ? 'Add to bag' : 'Sold out'}
            </button>
          </div>

          <Link
            to={`/category/${product.category.toLowerCase()}`}
            className="inline-flex items-center justify-center rounded-full border border-pink-200 bg-pink-50 px-6 py-3 text-sm font-semibold text-pink-700 hover:bg-pink-100 transition"
          >
            ← Back to {product.category}
          </Link>
        </div>
      </div>
    </section>
  );
}
