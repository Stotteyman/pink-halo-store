import { useState, useEffect } from 'react';
import {
  fetchManufacturers,
  discoverManufacturers,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
} from '../lib/supabase';
import type { PHManufacturer, ManufacturerStatus } from '../lib/types';

const STATUS_OPTIONS: ManufacturerStatus[] = ['prospect', 'contacted', 'sampling', 'active', 'inactive'];

const STATUS_COLORS: Record<string, string> = {
  prospect:  'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  sampling:  'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
  inactive:  'bg-red-100 text-red-700',
};

const BLANK_FORM = {
  name: '', website: '', contact_email: '', phone: '', country: '',
  moq: '', lead_time_days: '', category: '', notes: '', rating: '',
  tags: '', status: 'prospect' as ManufacturerStatus,
};

export default function AdminManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<PHManufacturer[]>([]);
  const [discovered, setDiscovered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'my' | 'discover'>('my');
  const [search, setSearch] = useState('');
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  async function loadMy(s?: string) {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (s) params.search = s;
      const data = await fetchManufacturers(params);
      setManufacturers(data.manufacturers || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDiscover() {
    if (!discoverQuery.trim()) return;
    setDiscoverLoading(true);
    try {
      const data = await discoverManufacturers(discoverQuery.trim());
      setDiscovered(data.manufacturers || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDiscoverLoading(false);
    }
  }

  useEffect(() => { loadMy(); }, []);

  function openNew() {
    setForm(BLANK_FORM);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(m: PHManufacturer) {
    setForm({
      name: m.name || '',
      website: m.website || '',
      contact_email: m.contact_email || '',
      phone: m.phone || '',
      country: m.country || '',
      moq: m.moq?.toString() || '',
      lead_time_days: m.lead_time_days?.toString() || '',
      category: m.category || '',
      notes: m.notes || '',
      rating: m.rating?.toString() || '',
      tags: (m.tags || []).join(', '),
      status: m.status,
    });
    setEditId(m.id);
    setShowForm(true);
  }

  function openFromDiscovery(m: any) {
    setForm({
      name: m.name || '',
      website: m.website || '',
      contact_email: m.contact_email || '',
      phone: '',
      country: m.country || '',
      moq: m.moq?.toString() || '',
      lead_time_days: m.lead_time_days?.toString() || '',
      category: m.category || '',
      notes: m.notes || '',
      rating: '',
      tags: (m.tags || []).join(', '),
      status: 'prospect',
    });
    setEditId(null);
    setShowForm(true);
    setTab('my');
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('Name is required'); return; }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        moq: form.moq ? parseInt(form.moq) : null,
        lead_time_days: form.lead_time_days ? parseInt(form.lead_time_days) : null,
        rating: form.rating ? parseFloat(form.rating) : null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      if (editId) {
        await updateManufacturer(editId, payload);
      } else {
        await createManufacturer(payload);
      }
      setShowForm(false);
      loadMy();
    } catch (e: any) {
      alert('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await deleteManufacturer(id);
      setManufacturers(prev => prev.filter(m => m.id !== id));
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    }
  }

  async function handleStatusChange(m: PHManufacturer, status: ManufacturerStatus) {
    try {
      await updateManufacturer(m.id, { status });
      setManufacturers(prev => prev.map(x => x.id === m.id ? { ...x, status } : x));
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div>
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Manufacturers</h1>
            <p className="text-sm text-gray-500">Suppliers, sourcing, and print-on-demand partners.</p>
          </div>
          <button onClick={openNew} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Add Manufacturer
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

        {/* Tabs */}
        <div className="flex border-b mb-6">
          {(['my', 'discover'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition ${tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t === 'my' ? `My Manufacturers (${manufacturers.length})` : '🔍 Discover Sources'}
            </button>
          ))}
        </div>

        {/* My Manufacturers */}
        {tab === 'my' && (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              <input
                className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px]"
                placeholder="Search name, category, country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadMy(search)}
              />
              <button onClick={() => loadMy(search)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">Search</button>
              <button onClick={() => { setSearch(''); loadMy(); }} className="border px-4 py-2 rounded-lg text-sm">Reset</button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : manufacturers.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
                <p className="text-lg font-medium mb-2">No manufacturers yet</p>
                <p className="text-sm mb-4">Use the Discover tab to find sources, or add one manually.</p>
                <button onClick={() => setTab('discover')} className="text-blue-600 hover:underline text-sm">Browse supplier directory →</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {manufacturers.map(m => (
                  <div key={m.id} className="bg-white rounded-xl border p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{m.name}</h3>
                        {m.country && <p className="text-sm text-gray-500">{m.country} {m.category ? `· ${m.category}` : ''}</p>}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                    </div>

                    <div className="flex gap-4 text-sm text-gray-600">
                      {m.moq && <span>MOQ: {m.moq}</span>}
                      {m.lead_time_days && <span>Lead: {m.lead_time_days}d</span>}
                      {m.rating && <span>⭐ {m.rating}</span>}
                    </div>

                    {m.notes && <p className="text-xs text-gray-500 line-clamp-2">{m.notes}</p>}

                    {m.website && (
                      <a href={m.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate">
                        {m.website}
                      </a>
                    )}

                    <div className="flex gap-2 mt-auto pt-2 border-t flex-wrap">
                      {m.website && (
                        <a href={m.website} target="_blank" rel="noreferrer" className="text-xs border px-2 py-1 rounded hover:bg-gray-50 text-blue-600">
                          Visit
                        </a>
                      )}
                      {STATUS_OPTIONS.filter(s => s !== m.status).slice(0, 2).map(s => (
                        <button key={s} onClick={() => handleStatusChange(m, s)} className="text-xs border px-2 py-1 rounded hover:bg-gray-50">→ {s}</button>
                      ))}
                      <button onClick={() => openEdit(m)} className="text-xs border px-2 py-1 rounded hover:bg-gray-50 ml-auto">Edit</button>
                      <button onClick={() => handleDelete(m.id, m.name)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Discover */}
        {tab === 'discover' && (
          <div>
            <div className="bg-white rounded-xl border p-6 mb-6">
              <p className="text-sm text-gray-600 mb-3">Search our curated directory of vetted wholesale suppliers, factories, and print-on-demand partners.</p>
              <div className="flex gap-3">
                <input
                  className="border rounded-lg px-3 py-2 text-sm flex-1"
                  placeholder="e.g. apparel, loungewear, accessories, print on demand..."
                  value={discoverQuery}
                  onChange={e => setDiscoverQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDiscover()}
                />
                <button onClick={handleDiscover} disabled={discoverLoading} className="bg-pink-500 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {discoverLoading ? 'Searching...' : 'Search'}
                </button>
                <button onClick={() => { setDiscoverQuery(''); handleDiscover(); }} className="border px-4 py-2 rounded-lg text-sm">Show All</button>
              </div>
            </div>

            {discovered.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {discovered.map((m, i) => (
                  <div key={i} className="bg-white rounded-xl border p-5 flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{m.name}</h3>
                      <p className="text-sm text-gray-500">{m.country} · {m.category}</p>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      {m.moq != null && <span>MOQ: {m.moq}</span>}
                      {m.lead_time_days && <span>Lead: {m.lead_time_days}d</span>}
                    </div>
                    {m.tags && <div className="flex gap-1 flex-wrap">{m.tags.map((t: string) => <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>)}</div>}
                    {m.notes && <p className="text-xs text-gray-500">{m.notes}</p>}
                    {m.website && <a href={m.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline truncate">{m.website}</a>}
                    <button
                      onClick={() => openFromDiscovery(m)}
                      className="mt-auto bg-gray-900 text-white text-xs py-2 rounded-lg font-medium hover:bg-gray-700"
                    >
                      + Add to My Manufacturers
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add/Edit form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editId ? 'Edit Manufacturer' : 'Add Manufacturer'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Name *', key: 'name', span: 2 },
                  { label: 'Website', key: 'website' },
                  { label: 'Contact Email', key: 'contact_email' },
                  { label: 'Phone', key: 'phone' },
                  { label: 'Country', key: 'country' },
                  { label: 'Category', key: 'category' },
                  { label: 'MOQ (min order qty)', key: 'moq', type: 'number' },
                  { label: 'Lead Time (days)', key: 'lead_time_days', type: 'number' },
                  { label: 'Rating (0–5)', key: 'rating', type: 'number' },
                  { label: 'Tags (comma-separated)', key: 'tags' },
                ].map(({ label, key, type, span }) => (
                  <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type={type || 'text'}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={(form as any)[key]}
                      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value as ManufacturerStatus }))}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Manufacturer'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-3 border rounded-xl text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
