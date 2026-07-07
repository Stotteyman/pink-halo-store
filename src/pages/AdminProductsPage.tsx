import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts, deleteProduct, updateProduct } from '../lib/supabase';
import type { PHProduct } from '../lib/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<PHProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { limit: String(limit), offset: String((page - 1) * limit) };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await fetchProducts(params);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(p: PHProduct) {
    const next = p.status === 'active' ? 'draft' : 'active';
    await updateProduct(p.id, { status: next });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return;
    await deleteProduct(id);
    load();
  }

  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500">{total} items in catalog</p>
          </div>
          <Link to="/admin/products/new" className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
            Add product
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Search by name"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={() => { setStatusFilter('active'); setPage(1); }}
            className="border border-gray-300 hover:border-gray-400 px-3 py-2 rounded-lg text-sm text-gray-700"
          >
            Active only
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">
          <p className="text-3xl mb-2">No products yet</p>
          <p className="text-sm mb-4">Create your first product to start selling.</p>
          <Link to="/admin/products/new" className="text-sm text-gray-900 underline">Add product</Link>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Product</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Price</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Stock</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Variants</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded-md border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-md border border-gray-200 bg-gray-100" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          {p.sku && <p className="text-xs text-gray-500">SKU: {p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <p className={p.stock <= p.low_stock_threshold ? 'text-red-600 font-semibold' : 'text-gray-700'}>{p.stock}</p>
                      <p className="text-[11px] text-gray-500">Alert at {p.low_stock_threshold}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.product_variants?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        p.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={'/admin/products/' + p.id + '/edit'} className="text-xs font-medium text-gray-700 border border-gray-300 px-2 py-1 rounded-md hover:bg-gray-50">Edit</Link>
                        <button onClick={() => toggleStatus(p)} className="text-xs font-medium text-gray-700 border border-gray-300 px-2 py-1 rounded-md hover:bg-gray-50">
                          {p.status === 'active' ? 'Set draft' : 'Set active'}
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="text-xs font-medium text-red-600 border border-red-200 px-2 py-1 rounded-md hover:bg-red-50">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {products.map((p) => (
              <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                  <span className="text-xs text-gray-500">${Number(p.price).toFixed(2)}</span>
                </div>
                <div className="mt-2 text-xs text-gray-600 flex items-center gap-3">
                  <span>Stock: {p.stock}</span>
                  <span>Variants: {p.product_variants?.length ?? 0}</span>
                  <span className="capitalize">{p.status}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link to={'/admin/products/' + p.id + '/edit'} className="text-xs border border-gray-300 px-2 py-1 rounded-md">Edit</Link>
                  <button onClick={() => toggleStatus(p)} className="text-xs border border-gray-300 px-2 py-1 rounded-md">
                    {p.status === 'active' ? 'Set draft' : 'Set active'}
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded-md">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-1 flex-wrap">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Prev
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${n === page ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 rounded-lg text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
