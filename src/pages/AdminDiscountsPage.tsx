import { useEffect, useState } from 'react';
import { fetchDiscounts, createDiscount, updateDiscount, deleteDiscount } from '../lib/supabase';
import type { PHDiscount, DiscountKind } from '../lib/types';

const BLANK_FORM = { name: '', kind: 'sitewide' as DiscountKind, scope_id: '', percent_off: '10' };

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<PHDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDiscounts();
      setDiscounts(data.discounts || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setForm(BLANK_FORM);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('Name is required'); return; }
    const percent = parseFloat(form.percent_off);
    if (!(percent > 0 && percent <= 100)) { alert('Percent off must be between 0 and 100'); return; }
    if (form.kind !== 'sitewide' && !form.scope_id.trim()) { alert('A category or product ID is required for this discount type'); return; }

    setSaving(true);
    try {
      await createDiscount({
        name: form.name.trim(),
        kind: form.kind,
        scope_id: form.kind === 'sitewide' ? undefined : form.scope_id.trim(),
        percent_off: percent,
        active: true,
      });
      setShowForm(false);
      load();
    } catch (e) {
      alert('Save failed: ' + e);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(discount: PHDiscount) {
    try {
      await updateDiscount(discount.id, { active: !discount.active });
      setDiscounts(prev => prev.map(d => d.id === discount.id ? { ...d, active: !d.active } : d));
    } catch (e) {
      alert(String(e));
    }
  }

  async function handleDelete(discount: PHDiscount) {
    if (!confirm(`Delete "${discount.name}"? This cannot be undone.`)) return;
    try {
      await deleteDiscount(discount.id);
      setDiscounts(prev => prev.filter(d => d.id !== discount.id));
    } catch (e) {
      alert('Delete failed: ' + e);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Discounts</h1>
          <p className="text-sm text-gray-500">Sitewide, category, and product-level sales.</p>
        </div>
        <button onClick={openNew} className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add discount
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">Loading...</div>
      ) : discounts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          <p className="mb-2">No discounts yet.</p>
          <button onClick={openNew} className="text-sm text-gray-900 underline">Create one</button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Name</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Type</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Off</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Status</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map(d => (
                <tr key={d.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                  <td className="px-4 py-3 text-gray-700 capitalize">{d.kind}{d.scope_id ? ` (${d.scope_id.slice(0, 8)}…)` : ''}</td>
                  <td className="px-4 py-3 text-gray-700">{d.percent_off}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {d.active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive(d)} className="text-xs font-medium text-gray-700 border border-gray-300 px-2 py-1 rounded-md hover:bg-gray-50">
                        {d.active ? 'Pause' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(d)} className="text-xs font-medium text-red-600 border border-red-200 px-2 py-1 rounded-md hover:bg-red-50">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add discount</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Opening Sale" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Applies to</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.kind} onChange={e => setForm(prev => ({ ...prev, kind: e.target.value as DiscountKind }))}>
                  <option value="sitewide">Entire store</option>
                  <option value="category">One category</option>
                  <option value="product">One product</option>
                </select>
              </div>
              {form.kind !== 'sitewide' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">{form.kind === 'category' ? 'Category ID' : 'Product ID'}</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="UUID" value={form.scope_id} onChange={e => setForm(prev => ({ ...prev, scope_id: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Percent off</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" min="1" max="100" value={form.percent_off} onChange={e => setForm(prev => ({ ...prev, percent_off: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Create discount'}
              </button>
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
