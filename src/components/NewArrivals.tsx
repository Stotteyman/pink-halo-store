import { useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Product } from '../lib/types';
import { toggleWishlist, useWishlist } from '../lib/wishlist';

type Props = {
  title: string;
  products: Product[];
  formatCurrency: (v: number) => string;
  viewAllTo: string;
};

const placeholder =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533"><rect width="100%" height="100%" fill="%23F0E3DC"/></svg>');

export default function NewArrivals({ title, products, formatCurrency, viewAllTo }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const wishlist = useWishlist();

  if (products.length === 0) return null;

  const by = (dir: number) => scroller.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <section className="bg-cream pb-14 lg:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between gap-5 mb-8 lg:mb-12">
          <div>
            <p className="overline text-gold mb-3">01 — Just dropped</p>
            <h2 className="font-serif font-medium text-ink leading-none text-[30px] md:text-5xl">
              {title === 'New Arrivals' ? (
                <>New <em className="italic text-rose">arrivals</em></>
              ) : (
                title
              )}
            </h2>
          </div>
          <Link to={viewAllTo} className="link-more text-ink">
            Shop all new
          </Link>
        </div>

        <div className="relative">
          <button
            aria-label="Scroll left"
            onClick={() => by(-1)}
            className="hidden sm:grid place-items-center absolute -left-4 top-[36%] z-10 w-10 h-10 rounded-full bg-white border border-hairline shadow-md text-ink hover:text-rose transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <div
            ref={scroller}
            className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth pb-2 snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((p) => {
              const wished = wishlist.includes(p.id);
              return (
                <article
                  key={p.id}
                  className="snap-start shrink-0 w-[62%] sm:w-60 group cursor-pointer"
                  onClick={() => navigate(p.link || `/${p.category.toLowerCase()}/${p.slug ?? ''}`)}
                >
                  <div className="relative overflow-hidden bg-shell" style={{ aspectRatio: '3/4' }}>
                    <img
                      src={p.imageUrl || placeholder}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-105"
                      onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; t.src = placeholder; }}
                    />
                    <button
                      aria-label="Add to wishlist"
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                      className="absolute top-2.5 right-2.5 grid place-items-center w-9 h-9 rounded-full bg-white/90 shadow-sm hover:bg-white text-rose transition-colors"
                    >
                      <svg className="w-4 h-4" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                    {p.preorder && (
                      <span className="absolute top-3 left-3 bg-rose text-white text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5">Preorder</span>
                    )}
                    {!p.preorder && p.stock === 0 && (
                      <span className="absolute top-3 left-3 bg-ink/85 text-white text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5">Sold Out</span>
                    )}
                    {!p.preorder && p.stock > 0 && (p.tags || []).includes('new') && (
                      <span className="absolute top-3 left-3 bg-white text-ink text-[9px] font-bold uppercase tracking-[0.18em] px-2.5 py-1.5">New</span>
                    )}
                  </div>
                  <p className="mt-3 overline !tracking-[0.26em] text-gold text-[9px]">{p.category}</p>
                  <h3 className="mt-1 font-serif text-base text-ink leading-snug truncate">{p.name}</h3>
                  <div className="mt-0.5 flex items-baseline gap-2 text-[13px] font-semibold text-ink">
                    {p.compareAtPrice != null && <s className="text-ink-soft/70 font-normal">{formatCurrency(p.compareAtPrice)}</s>}
                    <span>{formatCurrency(p.price)}</span>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            aria-label="Scroll right"
            onClick={() => by(1)}
            className="hidden sm:grid place-items-center absolute -right-4 top-[36%] z-10 w-10 h-10 rounded-full bg-white border border-hairline shadow-md text-ink hover:text-rose transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
