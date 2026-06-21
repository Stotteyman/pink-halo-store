import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { Product } from '../lib/types';

type Props = {
  product: Product;
  onAdd: (p: Product) => void;
  formatCurrency: (v: number) => string;
  productMask: (s: string) => string;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ProductCard({ product, onAdd, formatCurrency, productMask }: Props) {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const productPath = `/${product.category.toLowerCase()}/${slugify(product.name)}`;
  const placeholderImage =
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="%23FBE6EE"/><text x="50%" y="50%" fill="%23DD5A8A" font-family="Inter,sans-serif" font-size="28" dominant-baseline="middle" text-anchor="middle">Image unavailable</text></svg>`
    );

  return (
    <motion.article
      className="bg-white/95 border border-pink-100 rounded-[2rem] overflow-hidden flex flex-col h-full cursor-pointer group relative text-pink-900 shadow-[0_30px_90px_rgba(255,135,183,0.16)]"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      onClick={() => navigate(productPath)}
    >
      <div className="aspect-square bg-pink-50 flex items-center justify-center relative overflow-hidden flex-shrink-0 border-b border-pink-100">
        <motion.img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.35 }}
          onError={(event) => {
            const target = event.currentTarget as HTMLImageElement;
            target.onerror = null;
            target.src = placeholderImage;
          }}
        />

        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(circle at 20% 30%, rgba(255, 217, 232, 0.35), transparent 35%), radial-gradient(circle at 80% 70%, rgba(244, 194, 122, 0.22), transparent 35%)',
          }}
          transition={{ duration: 0.3 }}
        />

        <div className="absolute inset-x-0 top-4 flex justify-between px-4">
          {product.stock === 0 ? (
            <span className="rounded-full bg-pink-100/90 px-3 py-1 text-[0.65rem] font-semibold uppercase text-pink-700 shadow-sm">Sold Out</span>
          ) : product.stock < 5 ? (
            <span className="rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white px-3 py-1 text-[0.65rem] font-semibold uppercase shadow-lg">Low Stock</span>
          ) : null}
          <motion.button
            onClick={(event) => {
              event.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            className="rounded-full bg-white/90 p-2 text-pink-600 shadow-sm hover:bg-white"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </motion.button>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-pink-500">{product.category}</span>
        <h3 className="text-base font-semibold text-pink-900 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-pink-600 flex-1 line-clamp-2">{productMask(product.description)}</p>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-pink-100 pt-4">
          <span className="text-lg font-semibold text-pink-800">{formatCurrency(product.price)}</span>
          <motion.button
            onClick={(event) => {
              event.stopPropagation();
              onAdd(product);
            }}
            className="rounded-full bg-gradient-to-r from-pink-500 to-amber-300 px-4 py-2 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={product.stock > 0 ? { scale: 1.05 } : {}}
            whileTap={product.stock > 0 ? { scale: 0.95 } : {}}
            disabled={product.stock === 0}
          >
            {product.stock > 0 ? 'Add' : 'Sold Out'}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
