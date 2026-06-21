import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../lib/types';
import { formatCurrency, slugify } from '../lib/utils';

interface ProductDetailPageProps {
  products: Product[];
  cart: Record<string, number>;
  setCart: (cart: Record<string, number>) => void;
}

export default function ProductDetailPage({ products, cart, setCart }: ProductDetailPageProps) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const product = products.find(p => slugify(p.name) === slug);

  if (!product) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-pink-900 mb-4">Product not found</h1>
          <Link to="/" className="text-pink-600 hover:text-pink-700">Back to shop</Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    setCart({
      ...cart,
      [product.id]: (cart[product.id] || 0) + quantity
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex-1 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-gray-100 rounded-2xl h-96 md:h-auto overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div>
            <h1 className="text-4xl font-serif font-bold text-pink-900 mb-2">{product.name}</h1>
            <p className="text-lg text-pink-700 mb-6">{product.description}</p>

            <div className="mb-8 p-4 border border-pink-200 rounded-xl">
              <p className="text-sm text-pink-600 mb-2">Price</p>
              <p className="text-3xl font-bold text-pink-900">{formatCurrency(product.price)}</p>
            </div>

            {product.stock > 0 ? (
              <>
                <div className="mb-6 flex items-center gap-4">
                  <span className="text-sm text-pink-700">Quantity:</span>
                  <div className="flex items-center gap-2 border border-pink-200 rounded-full px-3 py-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-pink-700 hover:text-pink-900"
                    >
                      −
                    </button>
                    <span className="w-8 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="text-pink-700 hover:text-pink-900"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`w-full py-3 rounded-full font-semibold mb-3 transition ${
                    added
                      ? 'bg-green-500 text-white'
                      : 'bg-pink-500 text-white hover:bg-pink-600'
                  }`}
                >
                  {added ? '✓ Added to cart' : 'Add to cart'}
                </button>
                <button
                  onClick={() => navigate('/cart')}
                  className="w-full py-3 border border-pink-200 text-pink-700 rounded-full font-semibold hover:bg-pink-50 transition"
                >
                  View cart
                </button>
              </>
            ) : (
              <div className="text-center py-6 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 font-semibold">Out of stock</p>
              </div>
            )}

            <Link to="/" className="block text-center text-pink-600 hover:text-pink-700 mt-6">
              ← Back to shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
