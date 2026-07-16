import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Product } from '../lib/types';
import NotFound from './NotFound';
import { toggleWishlist, useWishlist } from '../lib/wishlist';
import { colorHex, type StorefrontVariant } from '../lib/variants';

type Props = {
  products: Product[];
  onAdd: (product: Product, quantity: number, openDrawer?: boolean, variant?: StorefrontVariant) => void;
  setCartOpen: (open: boolean) => void;
  formatCurrency: (value: number) => string;
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const placeholder =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100"><rect width="100%" height="100%" fill="%23F0E3DC"/></svg>');

function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [isOpen, setIsOpen] = useState(!!open);
  return (
    <div className="border-b border-hairline">
      <button onClick={() => setIsOpen((o) => !o)} className="w-full flex items-center justify-between py-4 text-left">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">{title}</span>
        <span className="text-rose text-xl leading-none font-light">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && <div className="pb-5 text-sm text-ink-soft leading-relaxed">{children}</div>}
    </div>
  );
}

export default function ProductDetail({ products, onAdd, setCartOpen, formatCurrency }: Props) {
  const params = useParams<{ category: string; slug: string }>();
  const navigate = useNavigate();
  const categoryParam = params.category?.toLowerCase() ?? '';
  const slug = params.slug ?? '';
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const wishlist = useWishlist();

  const product = products.find(
    (item) => item.category.toLowerCase() === categoryParam && (item.slug === slug || slugify(item.name) === slug)
  );

  const variants = product?.variants || [];
  const hasVariants = variants.length > 0;

  // Distinct colors/sizes actually offered on this product
  const colors = useMemo(() => {
    const seen = new Map<string, { name: string; hex: string }>();
    for (const v of variants) {
      if (v.color && !seen.has(v.color.toLowerCase())) {
        seen.set(v.color.toLowerCase(), { name: v.color, hex: v.hex || colorHex(v.color) || '#D8A7B1' });
      }
    }
    return [...seen.values()];
  }, [variants]);

  const sizes = useMemo(() => {
    const seen: string[] = [];
    for (const v of variants) {
      if (v.size && !seen.includes(v.size)) seen.push(v.size);
    }
    return seen;
  }, [variants]);

  const variantFor = (c: string | null, s: string | null) =>
    variants.find((v) => (colors.length === 0 || v.color === c || !v.color) && (sizes.length === 0 || v.size === s || !v.size));

  const isAvailable = (v?: StorefrontVariant) => !!v && (v.stock > 0 || Boolean(product?.preorder));

  // Default to the first in-stock combination
  useEffect(() => {
    if (!hasVariants) return;
    const firstAvailable = variants.find((v) => isAvailable(v)) || variants[0];
    setColor(firstAvailable?.color ?? null);
    setSize(firstAvailable?.size ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const selectedVariant = hasVariants ? variantFor(color, size) : undefined;

  const alsoLike = useMemo(() => {
    if (!product) return [];
    const same = products.filter((p) => p.id !== product.id && p.category === product.category);
    const others = products.filter((p) => p.id !== product.id && p.category !== product.category);
    return [...same, ...others].slice(0, 4);
  }, [product, products]);

  if (!product) return <NotFound />;

  const wished = wishlist.includes(product.id);
  const displayPrice = selectedVariant?.price != null ? selectedVariant.price : product.price;
  const effectiveStock = hasVariants ? (selectedVariant?.stock ?? 0) : product.stock;
  const selectionMissing = hasVariants && !selectedVariant;
  const soldOut = (effectiveStock <= 0 && !product.preorder) || selectionMissing;
  const afterpay = displayPrice / 4;

  function pickColor(next: string) {
    setColor(next);
    // Keep the size valid for the new color
    if (sizes.length > 0) {
      const stillValid = variants.some((v) => v.color === next && v.size === size && isAvailable(v));
      if (!stillValid) {
        const fallback = variants.find((v) => v.color === next && isAvailable(v)) || variants.find((v) => v.color === next);
        setSize(fallback?.size ?? null);
      }
    }
  }

  function buyNow() {
    onAdd(product!, 1, false, selectedVariant);
    navigate('/cart');
  }

  return (
    <section className="bg-cream pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid gap-10 lg:grid-cols-2 lg:py-12 items-start">
        {/* Image */}
        <div className="lg:sticky lg:top-28">
          <div className="relative overflow-hidden bg-shell" style={{ aspectRatio: '4/5' }}>
            <img
              src={product.imageUrl || placeholder}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; t.src = placeholder; }}
            />
            <button
              aria-label="Save to wishlist"
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-3 right-3 grid place-items-center w-10 h-10 rounded-full bg-white/90 shadow text-rose hover:bg-white transition-colors"
            >
              <svg className="w-5 h-5" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="pt-6 lg:pt-2">
          <p className="overline text-gold mb-3">{product.category}</p>
          <h1 className="font-serif font-medium text-ink text-4xl md:text-[44px] leading-[1.05]">{product.name}</h1>
          <div className="flex items-baseline gap-3 mt-4">
            {product.compareAtPrice != null && selectedVariant?.price == null && <s className="text-lg text-ink-soft/70 font-normal">{formatCurrency(product.compareAtPrice)}</s>}
            <span className="text-2xl font-semibold text-ink">{formatCurrency(displayPrice)}</span>
          </div>
          <p className="text-sm text-ink-soft mt-2">
            or 4 interest-free payments of {formatCurrency(afterpay)} <span className="text-rose font-semibold">available at checkout</span>
          </p>

          {/* Color — only the colors this product actually comes in */}
          {colors.length > 0 && (
            <div className="mt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink mb-3">
                Color <span className="text-ink-soft font-normal normal-case tracking-normal">— {color || 'select'}</span>
              </p>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => pickColor(c.name)}
                    aria-label={c.name}
                    title={c.name}
                    className={`w-9 h-9 rounded-full border-2 p-0.5 transition-colors ${color === c.name ? 'border-rose' : 'border-hairline hover:border-ink-soft'}`}
                  >
                    <span className="block w-full h-full rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size — greyed out when the combo is out of stock */}
          {sizes.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink">Size</p>
                <Link to="/help/size-guide" className="text-xs text-ink-soft underline underline-offset-4 hover:text-rose transition-colors">Size Guide</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const combo = variants.find((v) => (colors.length === 0 || v.color === color) && v.size === s);
                  const unavailable = !isAvailable(combo);
                  return (
                    <button
                      key={s}
                      onClick={() => !unavailable && setSize(s)}
                      disabled={unavailable}
                      className={`min-w-[48px] py-2.5 border text-[13px] font-semibold transition-colors ${size === s ? 'bg-ink text-cream border-ink' : unavailable ? 'bg-white text-ink-soft/40 border-hairline line-through cursor-not-allowed' : 'bg-white text-ink border-hairline hover:border-ink'}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="mt-9 space-y-3">
            <button onClick={() => { onAdd(product, 1, true, selectedVariant); setCartOpen(true); }} disabled={soldOut} className="btn-primary w-full">
              {selectionMissing ? 'Select options' : product.preorder ? 'Preorder' : soldOut ? 'Sold Out' : 'Add to Bag'}
            </button>
            <button onClick={buyNow} disabled={soldOut} className="btn-ghost w-full">
              Buy Now
            </button>
          </div>

          {/* Accordions */}
          <div className="mt-10">
            <Accordion title="Description" open>
              <p>{product.description || 'A signature Pink Halo Co. piece, made for everyday confidence.'}</p>
            </Accordion>
            <Accordion title="Details & Care">
              <p>Machine wash cold, inside out. Do not bleach. Tumble dry low or lay flat to dry. True to size — see our size guide for the perfect fit.</p>
            </Accordion>
            <Accordion title="Shipping & Returns">
              <p>Free shipping on orders over $75. Ships in 1–2 business days. Hassle-free returns within 30 days on unworn items with tags.</p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* You may also like */}
      {alsoLike.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-14">
          <div className="flex items-end justify-between gap-5 mb-8">
            <div>
              <p className="overline text-gold mb-3">Keep exploring</p>
              <h2 className="font-serif font-medium text-ink text-3xl leading-none">You may also <em className="italic text-rose">like</em></h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-5">
            {alsoLike.map((p) => (
              <div key={p.id} className="group cursor-pointer" onClick={() => { navigate(p.link || `/${p.category.toLowerCase()}/${p.slug ?? ''}`); window.scrollTo(0, 0); }}>
                <div className="relative overflow-hidden bg-shell" style={{ aspectRatio: '3/4' }}>
                  <img
                    src={p.imageUrl || placeholder}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-105"
                    onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.onerror = null; t.src = placeholder; }}
                  />
                  <button
                    aria-label="Save"
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                    className="absolute top-2.5 right-2.5 grid place-items-center w-8 h-8 rounded-full bg-white/90 text-rose hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill={wishlist.includes(p.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                </div>
                <p className="mt-3 font-serif text-base text-ink leading-snug truncate">{p.name}</p>
                <p className="text-[13px] font-semibold text-ink">{formatCurrency(p.price)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
