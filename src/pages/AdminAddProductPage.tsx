import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct, fetchManufacturers, uploadProductImage } from '../lib/supabase';
import type { PHManufacturer, ProductStatus } from '../lib/types';

interface ScrapedProduct {
  name: string;
  description: string;
  price: number;
  images: string[];
  tags: string[];
  imageUrl?: string;
  warning?: string | null;
  error?: string;
}

const CATEGORIES = ['Dresses', 'Tops', 'Bottoms', 'Sets', 'Lounge', 'Accessories', 'Sale'];

interface DraftVariant {
  name: string;
  color: string;
  size: string;
  sku: string;
  price: string;
  stock: string;
}

export default function AdminAddProductPage() {
  const navigate = useNavigate();
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAt, setCompareAt] = useState('');
  const [cost, setCost] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('0');
  const [lowStockThreshold, setLowStockThreshold] = useState('3');
  const [weight, setWeight] = useState('');
  const [shippingLeadDays, setShippingLeadDays] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [manufacturerSku, setManufacturerSku] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState('unassigned');
  const [manufacturers, setManufacturers] = useState<PHManufacturer[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [variants, setVariants] = useState<DraftVariant[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const priceValue = parseFloat(price || '0') || 0;
  const costValue = parseFloat(cost || '0') || 0;
  const margin = priceValue > 0 && costValue > 0 ? ((priceValue - costValue) / priceValue) * 100 : 0;
  useEffect(() => { fetchManufacturers().then(data => setManufacturers(data.manufacturers || [])).catch(() => undefined); }, []);

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError('');
    try {
      const res = await fetch('/api/fetch-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      });

      const data: ScrapedProduct = await res.json().catch(() => ({ error: 'Import service returned an invalid response.' } as ScrapedProduct));
      if (!res.ok) throw new Error(data.error || 'Unable to import this URL.');

      setName(data.name || '');
      setDescription(data.description || '');
      if (data.price) setPrice(String(data.price));
      setImages((data.images && data.images.length > 0 ? data.images : data.imageUrl ? [data.imageUrl] : []));
      setTags(data.tags || []);
      if (data.warning) setImportError(data.warning);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Import failed. Try another product URL.';
      setImportError(message);
    } finally {
      setImporting(false);
    }
  }

  function addImage() {
    const url = imageInput.trim();
    if (url && !images.includes(url)) setImages([...images, url]);
    setImageInput('');
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setUploadError('');
    try {
      const uploaded: string[] = [];
      for (const file of files) uploaded.push(await uploadProductImage(file));
      setImages((prev) => [...prev, ...uploaded.filter((u) => !prev.includes(u))]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  }

  function addVariant() {
    setVariants((current) => [
      ...current,
      { name: '', color: '', size: '', sku: '', price: '', stock: '0' },
    ]);
  }

  function updateVariant(index: number, key: keyof DraftVariant, value: string) {
    setVariants((current) =>
      current.map((variant, i) => (i === index ? { ...variant, [key]: value } : variant))
    );
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim() || !price) { setSaveError('Name and price are required.'); return; }
    if (!category) { setSaveError('Choose a category — it decides which room the product shows up in.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const payloadVariants = variants
        .filter((variant) => variant.name.trim() || variant.color.trim() || variant.size.trim() || variant.sku.trim())
        .map((variant, index) => {
          const cleanColor = variant.color.trim();
          const cleanSize = variant.size.trim();
          const computedName =
            variant.name.trim() ||
            [cleanColor, cleanSize].filter(Boolean).join(' / ') ||
            `Variant ${index + 1}`;
          return {
            name: computedName,
            sku: variant.sku.trim() || undefined,
            price: variant.price ? parseFloat(variant.price) : undefined,
            stock: parseInt(variant.stock) || 0,
            options: {
              ...(cleanColor ? { color: cleanColor } : {}),
              ...(cleanSize ? { size: cleanSize } : {}),
            },
          };
        });

      await createProduct({
        name: name.trim(),
        description: description.trim(),
        category,
        price: parseFloat(price),
        compare_at_price: compareAt ? parseFloat(compareAt) : undefined,
        cost: cost ? parseFloat(cost) : undefined,
        sku: sku.trim() || undefined,
        stock: parseInt(stock) || 0,
        low_stock_threshold: parseInt(lowStockThreshold) || 3,
        weight_oz: weight ? parseFloat(weight) : undefined,
        shipping_lead_days: shippingLeadDays ? parseInt(shippingLeadDays) : undefined,
        manufacturer_id: manufacturerId || undefined,
        manufacturer_sku: manufacturerSku || undefined,
        fulfillment_method: fulfillmentMethod as any,
        images,
        tags,
        status,
        variants: payloadVariants,
      });
      navigate('/admin/products');
    } catch (e) {
      setSaveError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/admin/products')} className="text-gray-400 hover:text-gray-600 text-sm">← Back</button>
          <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
        </div>

        {/* URL Import */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-5">
          <h2 className="font-semibold text-gray-800 mb-3">Import from URL</h2>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="https://supplier.com/product-page"
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
            />
            <button
              onClick={handleImport}
              disabled={importing}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
          {importError && <p className="text-red-500 text-xs mt-2">{importError}</p>}
        </div>

        {/* Product Form */}
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800">Product Details</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="Product name" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Product description" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Category * <span className="font-normal text-gray-400">— which room it appears in</span></label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price ($) *</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="29.99" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Compare at ($)</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" step="0.01" value={compareAt} onChange={e => setCompareAt(e.target.value)} placeholder="39.99" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Cost ($)</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="12.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stock</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" value={stock} onChange={e => setStock(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">SKU</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" value={sku} onChange={e => setSku(e.target.value)} placeholder="PH-001" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Low stock alert</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" value={lowStockThreshold} onChange={e => setLowStockThreshold(e.target.value)} placeholder="3" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Weight (oz)</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="4.5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ship lead (days)</label>
              <input className="w-full border rounded-lg px-3 py-2 text-sm" type="number" value={shippingLeadDays} onChange={e => setShippingLeadDays(e.target.value)} placeholder="5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Manufacturer</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={manufacturerId} onChange={e => setManufacturerId(e.target.value)}><option value="">Unassigned</option>{manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Fulfillment</label><select className="w-full border rounded-lg px-3 py-2 text-sm" value={fulfillmentMethod} onChange={e => setFulfillmentMethod(e.target.value)}>{['unassigned','in_house','manufacturer','print_on_demand','dropship'].map(v => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Manufacturer SKU</label><input className="w-full border rounded-lg px-3 py-2 text-sm" value={manufacturerSku} onChange={e => setManufacturerSku(e.target.value)} /></div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Images</label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="w-16 h-16 object-cover rounded border" />
                    <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="Image URL" value={imageInput} onChange={e => setImageInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addImage()} />
              <button onClick={addImage} className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Add</button>
            </div>
            <div className="mt-2">
              <label className={`inline-flex items-center gap-2 border border-dashed border-pink-300 rounded-lg px-3 py-2 text-sm text-pink-600 ${uploading ? 'opacity-60' : 'cursor-pointer hover:bg-pink-50'}`}>
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={handleUpload} />
                {uploading ? 'Uploading…' : '⬆ Upload photos from your device'}
              </label>
              {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tags</label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map(t => (
                  <span key={t} className="bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    {t}
                    <button onClick={() => setTags(tags.filter(x => x !== t))} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="e.g. summer, sale" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} />
              <button onClick={addTag} className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Add</button>
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-600">Variants (colors, sizes, per-item stock/price)</label>
              <button onClick={addVariant} className="border px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">+ Add variant</button>
            </div>

            {variants.length === 0 ? (
              <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                No variants yet. Add variants to manage color, size, SKU, pricing, and stock per item.
              </p>
            ) : (
              <div className="space-y-2">
                {variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-7 gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <input className="border rounded px-2 py-1.5 text-xs" placeholder="Variant name" value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} />
                    <input className="border rounded px-2 py-1.5 text-xs" placeholder="Color" value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} />
                    <input className="border rounded px-2 py-1.5 text-xs" placeholder="Size" value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} />
                    <input className="border rounded px-2 py-1.5 text-xs" placeholder="SKU" value={variant.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} />
                    <input className="border rounded px-2 py-1.5 text-xs" type="number" step="0.01" placeholder="Price $" value={variant.price} onChange={(e) => updateVariant(index, 'price', e.target.value)} />
                    <input className="border rounded px-2 py-1.5 text-xs" type="number" placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', e.target.value)} />
                    <button onClick={() => removeVariant(index)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 bg-white rounded px-2 py-1.5">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status & availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select className="border rounded-lg px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value as ProductStatus)}>
                <option value="draft">Draft — hidden from the store</option>
                <option value="active">Active — visible &amp; for sale</option>
                <option value="archived">Archived — hidden from the store</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Availability</label>
              <label className="flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={tags.includes('preorder')}
                  onChange={e => setTags(e.target.checked ? [...tags, 'preorder'] : tags.filter(t => t !== 'preorder'))}
                />
                <span>Preorder — buyable now with a “Preorder” badge, even at 0 stock</span>
              </label>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-semibold text-gray-700 mb-1">Quick summary</p>
            <p>Margin: {margin > 0 ? `${margin.toFixed(1)}%` : '—'}</p>
            <p>Inventory: {parseInt(stock || '0') <= 0 ? 'Out of stock' : `${stock} units`}</p>
            <p>Variants: {variants.length}</p>
          </div>

          {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Product'}
            </button>
            <button onClick={() => navigate('/admin/products')} className="border px-6 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
  );
}
