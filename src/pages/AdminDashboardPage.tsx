import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts, fetchOrders } from '../lib/supabase';
import type { OrderSummary } from '../lib/types';

export default function AdminDashboardPage() {
  const [productCount, setProductCount] = useState<number | null>(null);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchProducts({ limit: '1' }),
      fetchOrders({ summary: '1' }),
    ])
      .then(([pRes, oRes]) => {
        setProductCount(pRes.total ?? 0);
        setSummary(oRes.summary ?? null);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Products', value: productCount, link: '/admin/products' },
    { label: 'Orders', value: summary?.total_orders ?? 0, link: '/admin/orders' },
    { label: 'Revenue', value: summary ? '$' + (summary.total_revenue / 100).toFixed(2) : '$0.00', link: '/admin/orders' },
    { label: 'Pending orders', value: summary?.by_status?.pending ?? 0, link: '/admin/orders?status=pending' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">Live figures from the store database.</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <Link key={s.label} to={s.link} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors block">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{loading ? '—' : String(s.value)}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/products/new" className="inline-flex items-center bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium">
            + Add product
          </Link>
          <Link to="/admin/orders?status=pending" className="inline-flex items-center border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-lg text-sm font-medium text-gray-700">
            Review pending orders
          </Link>
          <Link to="/admin/manufacturers" className="inline-flex items-center border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-lg text-sm font-medium text-gray-700">
            Manage suppliers
          </Link>
          <Link to="/admin/discounts" className="inline-flex items-center border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-lg text-sm font-medium text-gray-700">
            Manage discounts
          </Link>
        </div>
      </div>

      {summary?.by_status && Object.keys(summary.by_status).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Orders by status</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.by_status).map(([status, count]) => (
              <span key={status} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium capitalize">
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
