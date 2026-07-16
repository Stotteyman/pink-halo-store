import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createQuote, deleteQuote, fetchManufacturers, fetchProducts, fetchQuotes, updateMinMargin, updateProduct, updateQuote } from '../lib/supabase';
import type { PHManufacturer, PHProduct } from '../lib/types';

interface Quote {
  id: string;
  manufacturer_id: string;
  product_id?: string | null;
  description?: string;
  quantity: number;
  unit_cost: number;
  shipping_cost: number;
  extra_cost: number;
  lead_time_days?: number | null;
  status: 'received' | 'selected' | 'rejected' | 'expired';
  notes?: string;
  quoted_at: string;
  landed_unit_cost: number;
  manufacturers?: { name: string };
  products?: { name: string; price: number };
}

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-blue-100 text-blue-700',
  selected: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-200 text-gray-600',
  expired: 'bg-amber-100 text-amber-700',
};

const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;

export default function AdminSourcingPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [minMargin, setMinMargin] = useState(50);
  const [minMarginInput, setMinMarginInput] = useState('50');
  const [products, setProducts] = useState<PHProduct[]>([]);
  const [manufacturers, setManufacturers] = useState<PHManufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = { manufacturer_id: '', product_id: '', description: '', quantity: '100', unit_cost: '', shipping_cost: '0', extra_cost: '0', lead_time_days: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [quoteData, productData, mfrData] = await Promise.all([
        fetchQuotes(),
        fetchProducts({ limit: '200' }),
        fetchManufacturers(),
      ]);
      setQuotes(quoteData.quotes || []);
      setMinMargin(Number(quoteData.min_margin_percent ?? 50));
      setMinMarginInput(String(quoteData.min_margin_percent ?? 50));
      setProducts(productData.products || []);
      setManufacturers(mfrData.manufacturers || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  // Pricing health: products with a known cost, margin vs the minimum
  const pricingHealth = useMemo(() => {
    return products
      .filter(p => p.cost != null && Number(p.cost) > 0 && Number(p.price) > 0)
      .map(p => {
        const price = Number(p.price);
        const cost = Number(p.cost);
        const marginPct = ((price - cost) / price) * 100;
        const profit = price - cost;
        const floorPrice = cost / (1 - minMargin / 100);
        return { product: p, price, cost, marginPct, profit, floorPrice, belowMin: marginPct < minMargin };
      })
      .sort((a, b) => a.marginPct - b.marginPct);
  }, [products, minMargin]);

  const belowMin = pricingHealth.filter(row => row.belowMin);

  async function saveMinMargin() {
    const value = parseFloat(minMarginInput);
    if (!Number.isFinite(value) || value < 0 || value > 95) { setError('Minimum margin must be between 0 and 95.'); return; }
    try {
      await updateMinMargin(value);
      setMinMargin(value);
      setNotice(`Minimum margin set to ${value}%.`);
    } catch (e) { setError(String(e)); }
  }

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!form.manufacturer_id || !form.unit_cost) { setError('Manufacturer and unit cost are required.'); return; }
    setSaving(true);
    setError('');
    try {
      await createQuote({
        manufacturer_id: form.manufacturer_id,
        product_id: form.product_id || null,
        description: form.description.trim() || null,
        quantity: parseInt(form.quantity) || 1,
        unit_cost: parseFloat(form.unit_cost),
        shipping_cost: parseFloat(form.shipping_cost) || 0,
        extra_cost: parseFloat(form.extra_cost) || 0,
        lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days) : null,
        notes: form.notes.trim() || null,
      });
      setForm(emptyForm);
      setShowForm(false);
      setNotice('Quote saved.');
      await loadAll();
    } catch (err) { setError(String(err)); } finally { setSaving(false); }
  }

  async function setStatus(quote: Quote, status: Quote['status']) {
    setError('');
    try {
      // Selecting a quote pushes its landed cost onto the product for margin tracking
      await updateQuote(quote.id, { status, apply_cost: status === 'selected' });
      setNotice(status === 'selected' && quote.product_id
        ? `Quote selected — product cost updated to ${money(quote.landed_unit_cost)}.`
        : 'Quote updated.');
      await loadAll();
    } catch (e) { setError(String(e)); }
  }

  async function removeQuote(id: string) {
    setError('');
    try { await deleteQuote(id); await loadAll(); } catch (e) { setError(String(e)); }
  }

  async function applyFloorPrice(row: (typeof pricingHealth)[number]) {
    setError('');
    try {
      await updateProduct(row.product.id, { price: Math.round(row.floorPrice * 100) / 100 });
      setNotice(`${row.product.name} repriced to ${money(row.floorPrice)} (${minMargin}% margin).`);
      await loadAll();
    } catch (e) { setError(String(e)); }
  }

  const marginFor = (quote: Quote) => {
    const price = quote.products?.price != null ? Number(quote.products.price) : null;
    if (price == null || price <= 0) return null;
    return { pct: ((price - quote.landed_unit_cost) / price) * 100, profit: price - quote.landed_unit_cost, price };
  };

  const input = 'border rounded-lg px-3 py-2 text-sm';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Sourcing &amp; Pricing</h1>
          <p className="text-sm text-gray-500 mt-1">Save manufacturer quotes, track landed cost and profit, and keep every price above your minimum margin.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">Min margin %</label>
          <input className={`${input} w-20`} type="number" min="0" max="95" value={minMarginInput} onChange={e => setMinMarginInput(e.target.value)} />
          <button onClick={saveMinMargin} className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Save</button>
          <button onClick={() => setShowForm(s => !s)} className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
            {showForm ? 'Close' : '+ Add quote'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}
      {notice && <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-sm">{notice}</div>}

      {showForm && (
        <form onSubmit={submitQuote} className="bg-white border border-gray-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Manufacturer *</label>
            <select className={`${input} w-full`} value={form.manufacturer_id} onChange={e => setForm({ ...form, manufacturer_id: e.target.value })}>
              <option value="">Select…</option>
              {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {manufacturers.length === 0 && <p className="text-xs text-gray-400 mt-1">No manufacturers yet — add them under <Link className="text-pink-600 underline" to="/admin/manufacturers">Manufacturers</Link>.</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Product (for margin math)</label>
            <select className={`${input} w-full`} value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Not linked yet</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Item / description</label>
            <input className={`${input} w-full`} placeholder="e.g. 2-piece velour track set, custom label" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity quoted</label>
            <input className={`${input} w-full`} type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Unit cost ($) *</label>
            <input className={`${input} w-full`} type="number" step="0.01" min="0" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Shipping total ($)</label>
            <input className={`${input} w-full`} type="number" step="0.01" min="0" value={form.shipping_cost} onChange={e => setForm({ ...form, shipping_cost: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Other costs ($)</label>
            <input className={`${input} w-full`} type="number" step="0.01" min="0" value={form.extra_cost} onChange={e => setForm({ ...form, extra_cost: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Lead time (days)</label>
            <input className={`${input} w-full`} type="number" min="0" value={form.lead_time_days} onChange={e => setForm({ ...form, lead_time_days: e.target.value })} />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
            <input className={`${input} w-full`} placeholder="MOQ, fabric, payment terms…" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="md:col-span-4">
            <button type="submit" disabled={saving} className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Saving…' : 'Save quote'}
            </button>
          </div>
        </form>
      )}

      {/* Pricing health */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Pricing health — minimum margin {minMargin}%
          {belowMin.length > 0 && <span className="ml-2 text-red-600 normal-case font-semibold">{belowMin.length} below minimum</span>}
        </p>
        {pricingHealth.length === 0 ? (
          <p className="text-sm text-gray-500">No products have a cost yet. Select a quote below (or set cost on the product) and margins will appear here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Cost</th>
                  <th className="py-2 pr-3">Price</th>
                  <th className="py-2 pr-3">Profit/unit</th>
                  <th className="py-2 pr-3">Margin</th>
                  <th className="py-2 pr-3">Floor ({minMargin}%)</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pricingHealth.map(row => (
                  <tr key={row.product.id} className="border-b border-gray-50">
                    <td className="py-2 pr-3">
                      <Link to={`/admin/products/${row.product.id}/edit`} className="text-gray-900 hover:text-pink-600">{row.product.name}</Link>
                    </td>
                    <td className="py-2 pr-3 text-gray-600">{money(row.cost)}</td>
                    <td className="py-2 pr-3 text-gray-600">{money(row.price)}</td>
                    <td className="py-2 pr-3 text-gray-600">{money(row.profit)}</td>
                    <td className={`py-2 pr-3 font-semibold ${row.belowMin ? 'text-red-600' : 'text-green-700'}`}>{row.marginPct.toFixed(1)}%</td>
                    <td className="py-2 pr-3 text-gray-600">{money(row.floorPrice)}</td>
                    <td className="py-2 text-right">
                      {row.belowMin && (
                        <button onClick={() => applyFloorPrice(row)} className="text-xs border border-pink-300 text-pink-700 px-2.5 py-1 rounded-lg hover:bg-pink-50">
                          Reprice to floor
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quotes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quotes ({quotes.length})</p>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : quotes.length === 0 ? (
          <p className="text-sm text-gray-500">No quotes yet. When a manufacturer replies with pricing, add it here — the landed cost and margin math happen automatically.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-3">Manufacturer</th>
                  <th className="py-2 pr-3">Item / product</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Landed/unit</th>
                  <th className="py-2 pr-3">Margin @ price</th>
                  <th className="py-2 pr-3">Lead</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map(quote => {
                  const m = marginFor(quote);
                  return (
                    <tr key={quote.id} className="border-b border-gray-50 align-top">
                      <td className="py-2.5 pr-3 text-gray-900">{quote.manufacturers?.name || '—'}</td>
                      <td className="py-2.5 pr-3 text-gray-600">
                        {quote.products?.name || quote.description || '—'}
                        {quote.notes && <p className="text-xs text-gray-400 mt-0.5">{quote.notes}</p>}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-600">{quote.quantity}</td>
                      <td className="py-2.5 pr-3 font-medium text-gray-900" title={`unit ${money(quote.unit_cost)} + shipping ${money(quote.shipping_cost)} + other ${money(quote.extra_cost)} over ${quote.quantity}`}>
                        {money(quote.landed_unit_cost)}
                      </td>
                      <td className="py-2.5 pr-3">
                        {m ? (
                          <span className={m.pct < minMargin ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}>
                            {m.pct.toFixed(1)}% ({money(m.profit)})
                          </span>
                        ) : <span className="text-gray-400">link a product</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-gray-600">{quote.lead_time_days != null ? `${quote.lead_time_days}d` : '—'}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[quote.status]}`}>{quote.status}</span>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        {quote.status !== 'selected' && (
                          <button onClick={() => setStatus(quote, 'selected')} className="text-xs border border-green-300 text-green-700 px-2 py-1 rounded-lg hover:bg-green-50 mr-1" title="Marks selected and writes landed cost to the product">
                            Select
                          </button>
                        )}
                        {quote.status !== 'rejected' && (
                          <button onClick={() => setStatus(quote, 'rejected')} className="text-xs border border-gray-300 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-50 mr-1">
                            Reject
                          </button>
                        )}
                        <button onClick={() => removeQuote(quote.id)} className="text-xs border border-red-200 text-red-500 px-2 py-1 rounded-lg hover:bg-red-50">
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
