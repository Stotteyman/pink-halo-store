import { Link } from 'react-router-dom';
import { Product } from '../lib/types';

interface AdminDashboardPageProps {
  products: Product[];
}

export default function AdminDashboardPage({ products }: AdminDashboardPageProps) {
  return (
    <div className="flex-1 py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-600 text-sm mb-2">Total Products</p>
            <p className="text-4xl font-bold text-gray-900">{products.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-600 text-sm mb-2">In Stock</p>
            <p className="text-4xl font-bold text-gray-900">
              {products.reduce((sum, p) => sum + p.stock, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-600 text-sm mb-2">Out of Stock</p>
            <p className="text-4xl font-bold text-gray-900">
              {products.filter(p => p.stock === 0).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Management Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              to="/admin/products"
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition"
            >
              <h3 className="font-bold text-gray-900 mb-2">Manage Products</h3>
              <p className="text-gray-600 text-sm">Add, edit, or delete products</p>
            </Link>
            <Link
              to="/admin/products/new"
              className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition"
            >
              <h3 className="font-bold text-gray-900 mb-2">Add New Product</h3>
              <p className="text-gray-600 text-sm">Create a new product listing</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
