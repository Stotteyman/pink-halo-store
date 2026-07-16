import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../lib/types';
import { toggleWishlist, useWishlist } from '../lib/wishlist';

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

const placeholderImage =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="%23F0E3DC"/><text x="50%" y="50%" fill="%23B4707E" font-family="Georgia,serif" font-size="26" dominant-baseline="middle" text-anchor="middle">Pink Halo Co.</text></svg>'
  );

export default function ProductCard({ product, onAdd, formatCurrency }: Props) {
  const navigate = useNavigate();
  const wishlist = useWishlist();
  const isWishlisted = wishlist.includes(product.id);
  const productPath = product.link || `/${product.category.toLowerCase()}/${slugify(product.name)}`;
  const soldOut = product.stock === 0 && !product.preorder;

  return (
    <motion.article
      className="group cursor-pointer"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onClick={() => navigate(productPath)}
    >
      <div className="relative overflow-hidden bg-shell" style={{ aspectRatio: '3/4' }}>
        <img
          src={product.imageUrl || placeholderImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-105"
          onError={(event) => {
            const target = event.currentTarget as HTMLImageElement;
            target.onerror = null;
            target.src = placeholderImage;
          }}
        />

        {/* Status tag */}
        {product.preorder ? (
          <span className="absolute top-3 left-3 bg-rose text-white text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5">Preorder</span>
        ) : product.stock === 0 ? (
          <span className="absolute top-3 left-3 bg-ink/85 text-white text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5">Sold Out</span>
        ) : product.compareAtPrice != null ? (
          <span className="absolute top-3 left-3 bg-rose text-white text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5">Sale</span>
        ) : (product.tags || []).includes('new') ? (
          <span className="absolute top-3 left-3 bg-white text-ink text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5">New</span>
        ) : null}

        {/* Wishlist */}
        <button
          aria-label="Add to wishlist"
          onClick={(event) => {
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 grid place-items-center w-9 h-9 rounded-full bg-white/90 shadow-sm text-rose transition-opacity hover:bg-white ${isWishlisted ? '' : 'sm:opacity-0 sm:group-hover:opacity-100'}`}
        >
          <svg className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Quick add — slides up on hover (always visible on touch).
            Products with variants route to the detail page to pick options. */}
        <button
          onClick={(event) => {
            event.stopPropagation();
            if ((product.variants || []).length > 0) navigate(productPath);
            else onAdd(product);
          }}
          disabled={soldOut}
          className="absolute inset-x-0 bottom-0 bg-rosewood-dark/90 text-white py-3.5 text-[10px] font-semibold uppercase tracking-[0.24em] transition-transform duration-300 sm:translate-y-full sm:group-hover:translate-y-0 disabled:cursor-not-allowed"
        >
          {(product.variants || []).length > 0
            ? `Choose options — ${formatCurrency(product.price)}`
            : product.preorder ? 'Preorder' : soldOut ? 'Sold Out' : `Add to bag — ${formatCurrency(product.price)}`}
        </button>
      </div>

      <div className="pt-3.5 flex flex-col gap-1">
        <span className="text-[9px] font-semibold uppercase tracking-[0.26em] text-gold">{product.category}</span>
        <h3 className="font-serif text-base text-ink leading-snug line-clamp-1">{product.name}</h3>
        <div className="flex items-baseline gap-2 text-[13px] font-semibold text-ink">
          {product.compareAtPrice != null && (
            <s className="text-ink-soft/70 font-normal">{formatCurrency(product.compareAtPrice)}</s>
          )}
          <span>{formatCurrency(product.price)}</span>
        </div>
      </div>
    </motion.article>
  );
}
