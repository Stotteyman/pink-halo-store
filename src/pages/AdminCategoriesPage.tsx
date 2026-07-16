import { useEffect, useState } from 'react';
import { createCategory, deleteCategory, fetchCategories, fetchProducts, fetchSettings, saveSettings, updateCategory, uploadProductImage } from '../lib/supabase';
import type { PHCategory, PHProduct } from '../lib/types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<PHCategory[]>([]);
  const [products, setProducts] = useState<PHProduct[]>([]);
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [newInImage, setNewInImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newName, setNewName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingHome, setSavingHome] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [catData, prodData, settingsData] = await Promise.all([
        fetchCategories(),
        fetchProducts({ limit: '200' }),
        fetchSettings(['featured_product_ids', 'home_new_in_image']),
      ]);
      setCategories(catData.categories || []);
      setProducts(prodData.products || []);
      const ids = settingsData.settings?.featured_product_ids;
      setFeaturedIds(Array.isArray(ids) ? ids.map(String) : []);
      setNewInImage(typeof settingsData.settings?.home_new_in_image === 'string' ? settingsData.settings.home_new_in_image as string : '');
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleImageUpload(category: PHCategory, file: File) {
    setBusyId(category.id);
    setError('');
    try {
      const url = await uploadProductImage(file);
      await updateCategory(category.id, { image_url: url });
      await loadAll();
    } catch (e) { setError(String(e)); } finally { setBusyId(null); }
  }

  async function handleField(category: PHCategory, field: string, value: string | number) {
    setBusyId(category.id);
    setError('');
    try {
      await updateCategory(category.id, { [field]: value });
      await loadAll();
    } catch (e) { setError(String(e)); } finally { setBusyId(null); }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setError('');
    try {
      await createCategory({ name: newName.trim(), sort_order: categories.length + 1 });
      setNewName('');
      await loadAll();
    } catch (e) { setError(String(e)); }
  }

  async function handleDelete(category: PHCategory) {
    if (!window.confirm(`Delete category "${category.name}"? Products keep existing but lose this category.`)) return;
    setError('');
    try { await deleteCategory(category.id); await loadAll(); } catch (e) { setError(String(e)); }
  }

  function toggleFeatured(id: string) {
    setFeaturedIds(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id].slice(0, 8));
  }

  async function saveHomepage() {
    setSavingHome(true);
    setError('');
    try {
      await saveSettings({ featured_product_ids: featuredIds, home_new_in_image: newInImage });
      setNotice('Homepage settings saved.');
    } catch (e) { setError(String(e)); } finally { setSavingHome(false); }
  }

  async function handleNewInUpload(file: File) {
    setError('');
    try { setNewInImage(await uploadProductImage(file)); } catch (e) { setError(String(e)); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Categories &amp; Homepage</h1>
        <p className="text-sm text-gray-500 mt-1">Manage collections, their tile photos on the homepage, and the featured products section.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">{error}</div>}
      {notice && <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-sm">{notice}</div>}

      {/* Categories */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Collections</p>
        {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
          <div className="space-y-3">
            {categories.map(category => (
              <div key={category.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 border border-gray-200 rounded-xl p-3 ${busyId === category.id ? 'opacity-60' : ''}`}>
                <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 grid place-items-center">
                  {category.image_url
                    ? <img src={category.image_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[10px] text-gray-400 text-center px-1">no photo</span>}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input className="border rounded-lg px-3 py-2 text-sm" defaultValue={category.name}
                    onBlur={e => e.target.value.trim() && e.target.value !== category.name && handleField(category, 'name', e.target.value.trim())} />
                  <input className="border rounded-lg px-3 py-2 text-sm" defaultValue={category.slug}
                    onBlur={e => e.target.value.trim() && e.target.value !== category.slug && handleField(category, 'slug', e.target.value.trim())} />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Order</label>
                    <input className="border rounded-lg px-2 py-2 text-sm w-16" type="number" defaultValue={category.sort_order}
                      onBlur={e => Number(e.target.value) !== category.sort_order && handleField(category, 'sort_order', Number(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs border border-pink-300 text-pink-700 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-pink-50">
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(category, f); e.target.value = ''; }} />
                    {category.image_url ? 'Change photo' : 'Add photo'}
                  </label>
                  <button onClick={() => handleDelete(category)} className="text-xs border border-red-200 text-red-500 px-2.5 py-1.5 rounded-lg hover:bg-red-50">Delete</button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input className="border rounded-lg px-3 py-2 text-sm flex-1" placeholder="New category name" value={newName}
                onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} />
              <button onClick={handleCreate} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">+ Add category</button>
            </div>
          </div>
        )}
      </div>

      {/* Homepage content */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Homepage</p>

        <div>
          <p className="text-sm font-medium text-gray-800 mb-1">"New In" tile photo</p>
          <p className="text-xs text-gray-500 mb-2">The first tile in Shop by Collection links to New In and uses this image.</p>
          <div className="flex items-center gap-3">
            <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden grid place-items-center">
              {newInImage ? <img src={newInImage} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400">default</span>}
            </div>
            <label className="text-xs border border-pink-300 text-pink-700 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-pink-50">
              <input type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleNewInUpload(f); e.target.value = ''; }} />
              Upload image
            </label>
            {newInImage && <button onClick={() => setNewInImage('')} className="text-xs text-gray-500 underline">Use default</button>}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-800 mb-1">Featured products <span className="text-gray-400 font-normal">({featuredIds.length}/8 selected)</span></p>
          <p className="text-xs text-gray-500 mb-2">Shown in the "Featured" section on the homepage, in the order selected.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
            {products.filter(p => p.status === 'active').map(p => {
              const selected = featuredIds.includes(p.id);
              return (
                <button key={p.id} onClick={() => toggleFeatured(p.id)}
                  className={`flex items-center gap-2 border rounded-lg p-2 text-left text-xs transition-colors ${selected ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <img src={p.images?.[0] || ''} alt="" className="w-9 h-11 object-cover rounded bg-gray-100" />
                  <span className="flex-1 line-clamp-2">{selected && <span className="text-pink-600 font-bold mr-1">{featuredIds.indexOf(p.id) + 1}.</span>}{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={saveHomepage} disabled={savingHome} className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {savingHome ? 'Saving…' : 'Save homepage settings'}
        </button>
      </div>
    </div>
  );
}
