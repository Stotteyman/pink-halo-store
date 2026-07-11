import { Link } from 'react-router-dom';
import { Product } from '../lib/types';
import { formatCurrency } from '../lib/utils';

interface CartPageProps {
  cart: Record<string, number>;
  setCart: (cart: Record<string, number>) => void;
  products: Product[];
  onCheckout: () => void;
}

export default function CartPage({ cart, setCart, products, onCheckout }: CartPageProps) {
  const cartItems = Object.entries(cart)
    .map(([productId, quantity]) => ({
      product: products.find(p => p.id === productId),
      quantity
    }))
    .filter(item => item.product);

  const total = cartItems.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const newCart = { ...cart };
      delete newCart[productId];
      setCart(newCart);
    } else {
      setCart({ ...cart, [productId]: newQuantity });
    }
  };

  const handleRemove = (productId: string) => {
    const newCart = { ...cart };
    delete newCart[productId];
    setCart(newCart);
  };

  return (
    <div className="flex-1 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-pink-900 mb-8">Your bag</h1>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(item => item.product && (
                <div key={item.product.id} className="border border-pink-100 rounded-xl p-4 flex gap-4">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-pink-900">{item.product.name}</h3>
                    <p className="text-sm text-pink-600">{formatCurrency(item.product.price)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleUpdateQuantity(item.product!.id, item.quantity - 1)}
                        className="px-2 py-1 border border-pink-200 rounded hover:bg-pink-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product!.id, item.quantity + 1)}
                        className="px-2 py-1 border border-pink-200 rounded hover:bg-pink-50"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleRemove(item.product!.id)}
                        className="ml-auto text-rose-500 hover:text-rose-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-pink-900">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border border-pink-100 rounded-xl p-6 h-fit">
              <h2 className="font-semibold text-pink-900 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4 pb-4 border-b border-pink-100 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <button
                onClick={onCheckout}
                className="block w-full py-3 luxury-cta-gradient text-white rounded-full hover:shadow-xl transition text-center font-semibold"
              >
                Checkout
              </button>
              <p className="text-xs text-pink-500 text-center mt-2">No account needed - checkout as a guest.</p>
              <Link to="/shop" className="block w-full mt-3 py-3 border border-pink-200 text-pink-700 rounded-full hover:bg-pink-50 transition text-center">
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-pink-600 text-lg mb-4">Your bag is empty</p>
            <Link to="/shop" className="inline-block px-8 py-3 luxury-cta-gradient text-white rounded-full hover:shadow-xl transition">
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
