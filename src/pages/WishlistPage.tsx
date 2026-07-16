import { Link } from 'react-router-dom';
import type { Product } from '../lib/types';
import { removeFromWishlist, useWishlist } from '../lib/wishlist';

type Props = {
  products: Product[];
  onAdd: (product: Product, quantity?: number, openDrawer?: boolean) => void;
  formatCurrency: (v: number) => string;
};

export default function WishlistPage({ products, onAdd, formatCurrency }: Props) {
  const ids = useWishlist();
  const items = products.filter((p) => ids.includes(p.id));

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
      <p className="overline text-gold mb-3">Saved with love</p>
      <h1 className="font-serif font-medium text-ink text-4xl md:text-5xl leading-none mb-2">Your wishlist</h1>
      <p className="text-[15px] text-ink-soft mb-10">{items.length} item{items.length === 1 ? '' : 's'} saved</p>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-hairline">
          <span className="text-gold text-2xl block mb-4" aria-hidden="true">✦</span>
          <p className="text-[15px] text-ink-soft mb-7">Nothing saved yet — tap the ♥ on any product to keep it here.</p>
          <Link to="/new" className="btn-primary">Shop New Arrivals</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-5">
          {items.map((p) => (
            <div key={p.id} className="group">
              <Link to={p.link} className="block overflow-hidden bg-shell" style={{ aspectRatio: '3/4' }}>
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-105" />
              </Link>
              <div className="pt-3.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-gold">{p.category}</p>
                <Link to={p.link} className="block font-serif text-base text-ink leading-snug mt-1 line-clamp-1 hover:text-rose transition-colors">{p.name}</Link>
                <p className="text-[13px] font-semibold text-ink mt-1">{formatCurrency(p.price)}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => onAdd(p, 1, true)} className="flex-1 bg-rose text-white py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] hover:bg-ink transition-colors">Add to Bag</button>
                  <button onClick={() => removeFromWishlist(p.id)} aria-label="Remove from wishlist" className="px-3 py-2.5 border border-hairline text-ink-soft hover:border-rose hover:text-rose text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
