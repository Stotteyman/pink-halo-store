import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchDropshipProducts,
  importDropshipUrls,
  syncDropship,
  toggleDropshipAutoSync,
  type DropshipProduct,
  type DropshipSettings,
} from '../lib/supabase';

const money = (n?: number) => `$${Number(n || 0).toFixed(2)}`;

const STATUS_STYLES: Record<string, string> = {
  ok: 'bg-emerald-100 text-emerald-700',
  price_changed: 'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-700',
  error: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-600',
};

const STATUS_LABEL: Record<string, string> = {
  ok: 'In sync',
  price_changed: 'Price changed',
  out_of_stock: 'Out of stock',
  error: 'Sync error',
  pending: 'Pending',
};

const PROVIDER_LABEL: Record<string, string> = {
  official: 'Official AliExpress API',
  third_party: 'Third-party API',
  scrape: 'Scraper (no API key)',
};

function timeAgo(iso?: string | null) {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminImportPage() {
  const [links, setLinks] = useState('');
  const [margin, setMargin] = useState('');
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [products, setProducts] = useState<DropshipProduct[]>([]);
  const [settings, setSettings] = useState<DropshipSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDropshipProducts();
      setProducts(data.products || []);
      setSettings(data.settings || null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runImport() {
    const urls = links.split(/[\n,]/).map(u => u.trim()).filter(Boolean);
    if (!urls.length) { setError('Paste at least one AliExpress product link.'); return; }
    setImporting(true);
    setError('');
    setReport([]);
    try {
      const res = await importDropshipUrls(urls, {
        status,
        margin_percent: margin ? Number(margin) : undefined,
      });
      const lines = res.results.map(r => {
        if (r.ok) return `✓ ${r.name} — cost ${money(r.cost)} → price ${money(r.price)} (${PROVIDER_LABEL[r.provider || 'scrape'] || r.provider})${r.warning ? ` · ${r.warning}` : ''}`;
        if (r.skipped) return `• Skipped: ${r.error}`;
        return `✗ ${r.url} — ${r.error}`;
      });
      setReport([`Imported ${res.imported} of ${res.results.length} link(s) as ${status}.`, ...lines]);
      setLinks('');
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setImporting(false);
    }
  }

  async function resync(id?: string) {
    if (id) setSyncingId(id); else setSyncingAll(true);
    setError('');
    try {
      await syncDropship(id);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setSyncingId(null);
      setSyncingAll(false);
    }
  }

  async function flipAutoSync(p: DropshipProduct) {
    try {
      await toggleDropshipAutoSync(p.id, !p.auto_sync);
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, auto_sync: !x.auto_sync } : x));
    } catch (e) {
      setError(String(e));
    }
  }

  const needAttention = products.filter(p => p.sync_status && p.sync_status !== 'ok').length;
  const input = 'border border-gray-300 rounded-lg px-3 py-2 text-sm';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-1">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Import from AliExpress</h1>
          {settings && (
            <span className="text-xs text-gray-500">
              Data source: <span className="font-medium text-gray-700">{PROVIDER_LABEL[settings.provider]}</span>
              {settings.provider === 'scrape' && <span className="text-amber-600"> · add an API key for reliable live sync</span>}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Paste AliExpress product links (one per line). Each becomes a {status === 'draft' ? 'draft' : 'live'} product in your catalog,
          priced automatically from the supplier cost, and kept in sync for price &amp; stock.
        </p>

        <textarea
          className={`${input} w-full font-mono text-xs`}
          rows={5}
          placeholder={'https://www.aliexpress.com/item/1005006854321789.html\nhttps://www.aliexpress.com/item/1005007123998450.html'}
          value={links}
          onChange={e => setLinks(e.target.value)}
        />

        <div className="flex flex-wrap items-end gap-3 mt-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Target margin %</label>
            <input
              className={`${input} w-28`}
              type="number" min="0" max="95"
              placeholder={settings ? String(settings.default_margin_percent) : '60'}
              value={margin}
              onChange={e => setMargin(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Publish as</label>
            <select className={`${input} w-32`} value={status} onChange={e => setStatus(e.target.value as 'draft' | 'active')}>
              <option value="draft">Draft (review first)</option>
              <option value="active">Active (live now)</option>
            </select>
          </div>
          <button
            onClick={runImport}
            disabled={importing}
            className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Import products'}
          </button>
          <span className="text-xs text-gray-400">Imports land in <b>{settings?.default_category || 'Accessories'}</b> · up to 25 links at once.</span>
        </div>

        {report.length > 0 && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 space-y-1">
            {report.map((line, i) => <p key={i} className={i === 0 ? 'font-semibold text-gray-900' : ''}>{line}</p>)}
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Dropship products ({products.length})
            {needAttention > 0 && <span className="ml-2 text-amber-600 normal-case font-semibold">{needAttention} need attention</span>}
          </p>
          <button
            onClick={() => resync()}
            disabled={syncingAll || products.length === 0}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {syncingAll ? 'Syncing all…' : 'Re-sync all'}
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500">No dropship products yet. Paste some AliExpress links above to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">Supplier cost</th>
                  <th className="py-2 pr-3">Your price</th>
                  <th className="py-2 pr-3">Stock</th>
                  <th className="py-2 pr-3">Sync</th>
                  <th className="py-2 pr-3">Last synced</th>
                  <th className="py-2 pr-3">Auto</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 align-top">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt="" className="w-9 h-9 rounded-md object-cover border border-gray-200" />
                          : <div className="w-9 h-9 rounded-md bg-gray-100 border border-gray-200" />}
                        <div>
                          <Link to={`/admin/products/${p.id}/edit`} className="text-gray-900 hover:text-pink-600 font-medium">{p.name}</Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{p.status}</span>
                            {p.source_url && <a href={p.source_url} target="_blank" rel="noreferrer" className="text-[10px] text-gray-400 hover:text-gray-600 underline">source ↗</a>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-gray-600">{money(p.source_price ?? p.cost)}</td>
                    <td className="py-2.5 pr-3 font-medium text-gray-900">{money(p.price)}</td>
                    <td className="py-2.5 pr-3 text-gray-600">{p.source_stock ?? p.stock}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.sync_status || 'pending']}`} title={p.sync_error || ''}>
                        {STATUS_LABEL[p.sync_status || 'pending']}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-gray-500 text-xs">{timeAgo(p.last_synced_at)}</td>
                    <td className="py-2.5 pr-3">
                      <button
                        onClick={() => flipAutoSync(p)}
                        className={`text-xs px-2 py-0.5 rounded-full border ${p.auto_sync ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-gray-300 text-gray-500'}`}
                        title="Toggle daily auto-sync"
                      >
                        {p.auto_sync ? 'On' : 'Off'}
                      </button>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => resync(p.id)}
                        disabled={syncingId === p.id}
                        className="text-xs border border-gray-300 px-2 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        {syncingId === p.id ? 'Syncing…' : 'Re-sync'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
