import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../lib/types';
import { generateId } from '../lib/utils';

interface AdminAddProductPageProps {
  setProducts: (callback: (prev: Product[]) => Product[]) => void;
}

export default function AdminAddProductPage({ setProducts }: AdminAddProductPageProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'Women',
    stock: '',
    link: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock) {
      alert('Please fill in all required fields');
      return;
    }

    const newProduct: Product = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      imageUrl: formData.imageUrl || 'https://via.placeholder.com/400',
      category: formData.category as any,
      stock: parseInt(formData.stock),
      link: formData.link,
      profitMargin: 0
    };

    setProducts(prev => [newProduct, ...prev]);
    navigate('/admin/products');
  };

  return (
    <div className="flex-1 py-12 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-8">Add Product</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          <div>
            <label className="block font-semibold text-gray-900 mb-2">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. Classic White T-Shirt"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Short product description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-900 mb-2">Price *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="29.99"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-900 mb-2">Stock *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-900 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option>Women</option>
              <option>Men</option>
              <option>Children</option>
              <option>Pets</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-900 mb-2">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-900 mb-2">Product Link</label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({...formData, link: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="https://example.com/product"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
            >
              Add Product
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="flex-1 py-3 border border-gray-200 text-gray-900 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
