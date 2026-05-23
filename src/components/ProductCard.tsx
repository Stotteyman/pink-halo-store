import { motion } from 'framer-motion';
import type { Product } from '../lib/types';

type Props = {
  product: Product;
  onAdd: (p: Product) => void;
  formatCurrency: (v: number) => string;
  productMask: (s: string) => string;
};

export default function ProductCard({ product, onAdd, formatCurrency, productMask }: Props) {
  return (
    <motion.article
      className="bg-neutral/5 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
    >
      <div className="aspect-square bg-gradient-to-b from-white/5 to-white/2 flex items-center justify-center relative">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        {product.stock < 5 && product.stock > 0 && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-primary to-secondary text-white px-3 py-1 rounded-full text-xs font-semibold">Low Stock</span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 right-3 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Sold Out</span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <span className="text-xs text-accent">{product.category}</span>
        <h3 className="text-sm font-semibold text-white">{product.name}</h3>
        <p className="text-sm text-gray-300 flex-1">{productMask(product.description)}</p>
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">{formatCurrency(product.price)}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => onAdd(product)} className="bg-gradient-to-r from-primary to-secondary text-white px-3 py-2 rounded-lg text-sm font-semibold">{product.stock > 0 ? 'Add' : 'Out'}</button>
            <a href={product.link} target="_blank" rel="noreferrer" className="border border-neutral-700 px-3 py-2 rounded-lg text-sm">View</a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
