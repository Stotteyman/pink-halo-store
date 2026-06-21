import { Link } from 'react-router-dom';
import { Product } from '../lib/types';
import { formatCurrency } from '../lib/utils';

interface AdminProductsPageProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

export default function AdminProductsPage({ products, setProducts }: AdminProductsPageProps) {
  const handleDelete = (id: string) => {
    if (confirm('Delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <div className="flex-1 py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-serif font-bold text-gray-900">Products</h1>
          <Link
            to="/admin/products/new"
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
          >
            + Add Product
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Price</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Stock</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-gray-900">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Link
                        to={`/admin/products/${product.id}/edit`}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-4">No products yet</p>
            <Link
              to="/admin/products/new"
              className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Create First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
