import { Link } from 'react-router-dom';
import { Product } from '../lib/types';
import { formatCurrency } from '../lib/utils';

interface CheckoutPageProps {
  cart: Record<string, number>;
  products: Product[];
}

export default function CheckoutPage({ cart, products }: CheckoutPageProps) {
  const cartItems = Object.entries(cart)
    .map(([productId, quantity]) => ({
      product: products.find(p => p.id === productId),
      quantity
    }))
    .filter(item => item.product);

  const total = cartItems.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);

  return (
    <div className="flex-1 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-pink-900 mb-8">Checkout</h1>

        <div className="space-y-8">
          {/* Order Summary */}
          <div className="border border-pink-100 rounded-xl p-6">
            <h2 className="font-semibold text-pink-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 pb-4 border-b border-pink-100 text-sm">
              {cartItems.map(item => item.product && (
                <div key={item.product.id} className="flex justify-between">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>{formatCurrency(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="border border-pink-100 rounded-xl p-6">
            <h2 className="font-semibold text-pink-900 mb-4">Shipping</h2>
            <form className="space-y-4">
              <input type="text" placeholder="Full Name" className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" required />
              <input type="email" placeholder="Email" className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" required />
              <input type="text" placeholder="Address" className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" required />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="City" className="px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" required />
                <input type="text" placeholder="Zip" className="px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" required />
              </div>
            </form>
          </div>

          {/* Payment */}
          <div className="border border-pink-100 rounded-xl p-6">
            <h2 className="font-semibold text-pink-900 mb-4">Payment</h2>
            <p className="text-pink-600 text-sm mb-4">Stripe integration coming soon. For now, contact us directly to complete your purchase.</p>
            <form className="space-y-4">
              <input type="text" placeholder="Card Name" className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" disabled />
              <input type="text" placeholder="Card Number" className="w-full px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" disabled />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="MM/YY" className="px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" disabled />
                <input type="text" placeholder="CVC" className="px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400" disabled />
              </div>
            </form>
          </div>

          <button className="w-full py-3 bg-gray-400 text-white rounded-full cursor-not-allowed">
            Complete Order (Coming Soon)
          </button>
          <Link to="/cart" className="block text-center text-pink-600 hover:text-pink-700">
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  );
}
