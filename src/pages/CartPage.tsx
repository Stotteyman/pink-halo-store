import { Link } from 'react-router-dom';
import { Product } from '../lib/types';
import { formatCurrency } from '../lib/utils';
import { parseCartKey, variantLabel } from '../lib/variants';

interface CartPageProps {
  cart: Record<string, number>;
  setCart: (cart: Record<string, number>) => void;
  products: Product[];
  onCheckout: () => void;
}

export default function CartPage({ cart, setCart, products, onCheckout }: CartPageProps) {
  const cartItems = Object.entries(cart)
    .map(([key, quantity]) => {
      const { productId, variantId } = parseCartKey(key);
      const product = products.find(p => p.id === productId);
      const variant = variantId ? (product?.variants || []).find(v => v.id === variantId) : undefined;
      if (!product || (variantId && !variant)) return null;
      const unitPrice = variant?.price != null ? variant.price : product.price;
      return { key, product, variant, unitPrice, quantity };
    })
    .filter(Boolean) as { key: string; product: Product; variant?: NonNullable<Product['variants']>[number]; unitPrice: number; quantity: number }[];

  const total = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleUpdateQuantity = (key: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const newCart = { ...cart };
      delete newCart[key];
      setCart(newCart);
    } else {
      setCart({ ...cart, [key]: newQuantity });
    }
  };

  const handleRemove = (key: string) => {
    const newCart = { ...cart };
    delete newCart[key];
    setCart(newCart);
  };

  return (
    <div className="flex-1 bg-cream py-12 lg:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <p className="overline text-gold mb-3">Pink Halo Co.</p>
        <h1 className="font-serif font-medium text-ink text-4xl md:text-5xl leading-none mb-10">Your bag</h1>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-3">
              {cartItems.map(item => (
                <div key={item.key} className="bg-white border border-hairline p-4 flex gap-4">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-24 h-28 object-cover bg-shell"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-gold">{item.product.category}</p>
                    <h3 className="font-serif text-lg text-ink leading-snug mt-0.5">{item.product.name}</h3>
                    {item.variant && <p className="text-xs text-ink-soft mt-0.5">{variantLabel(item.variant)}</p>}
                    <p className="text-[13px] font-semibold text-ink mt-1">{formatCurrency(item.unitPrice)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleUpdateQuantity(item.key, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-8 h-8 border border-hairline hover:border-rose text-ink transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm text-ink">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.key, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-8 h-8 border border-hairline hover:border-rose text-ink transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleRemove(item.key)}
                        className="ml-auto text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft hover:text-rose transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="font-serif font-medium text-lg text-ink">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-hairline p-6 h-fit">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink mb-5">Order Summary</h2>
              <div className="space-y-2.5 mb-4 pb-4 border-b border-hairline text-sm text-ink-soft">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-ink">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <div className="flex justify-between items-baseline mb-5">
                <span className="overline !tracking-[0.24em] text-ink-soft">Total</span>
                <span className="font-serif font-medium text-2xl text-ink">{formatCurrency(total)}</span>
              </div>
              <button onClick={onCheckout} className="btn-primary w-full">
                Checkout
              </button>
              <p className="text-xs text-ink-soft text-center mt-3">No account needed — checkout as a guest.</p>
              <Link to="/shop" className="btn-ghost w-full mt-3">
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-hairline">
            <span className="text-gold text-2xl block mb-4" aria-hidden="true">✦</span>
            <h2 className="font-serif font-medium text-ink text-3xl mb-3">Your bag is empty</h2>
            <p className="text-[15px] text-ink-soft mb-7">Add something you love to get started.</p>
            <Link to="/shop" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
