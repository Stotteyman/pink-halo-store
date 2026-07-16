import { useEffect, useState } from 'react';
import { COLOR_PRESETS, SIZE_PRESETS } from '../lib/variants';

export interface DraftVariant {
  id?: string;
  name: string;
  color: string;
  hex?: string;
  size: string;
  sku: string;
  price: string;
  stock: string;
}

type Props = {
  variants: DraftVariant[];
  onChange: (variants: DraftVariant[]) => void;
  defaultStock: string;
};

/**
 * Variant editor with quick color/size selection: pick the colors and sizes
 * the item comes in, hit Generate, and the color×size matrix is created.
 * Individual rows stay editable for per-combo stock, price, and SKU.
 */
export default function AdminVariantSection({ variants, onChange, defaultStock }: Props) {
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#D8A7B1');
  const [customSize, setCustomSize] = useState('');

  // Seed the pickers from variants that already exist (edit page)
  useEffect(() => {
    const seenColors = new Map<string, { name: string; hex: string }>();
    const seenSizes: string[] = [];
    for (const v of variants) {
      if (v.color && !seenColors.has(v.color.toLowerCase())) {
        seenColors.set(v.color.toLowerCase(), {
          name: v.color,
          hex: v.hex || COLOR_PRESETS.find(c => c.name.toLowerCase() === v.color.toLowerCase())?.hex || '#D8A7B1',
        });
      }
      if (v.size && !seenSizes.includes(v.size)) seenSizes.push(v.size);
    }
    if (seenColors.size > 0) setColors([...seenColors.values()]);
    if (seenSizes.length > 0) setSizes(seenSizes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasColor = (name: string) => colors.some(c => c.name.toLowerCase() === name.toLowerCase());

  function toggleColor(preset: { name: string; hex: string }) {
    setColors(current =>
      hasColor(preset.name)
        ? current.filter(c => c.name.toLowerCase() !== preset.name.toLowerCase())
        : [...current, preset]
    );
  }

  function addCustomColor() {
    const name = customColorName.trim();
    if (!name || hasColor(name)) return;
    setColors(current => [...current, { name, hex: customColorHex }]);
    setCustomColorName('');
  }

  function toggleSize(size: string) {
    setSizes(current => (current.includes(size) ? current.filter(s => s !== size) : [...current, size]));
  }

  function addCustomSize() {
    const size = customSize.trim();
    if (!size || sizes.includes(size)) return;
    setSizes(current => [...current, size]);
    setCustomSize('');
  }

  function generateMatrix() {
    const combos: { color: string; hex?: string; size: string }[] = [];
    if (colors.length > 0 && sizes.length > 0) {
      for (const c of colors) for (const s of sizes) combos.push({ color: c.name, hex: c.hex, size: s });
    } else if (colors.length > 0) {
      for (const c of colors) combos.push({ color: c.name, hex: c.hex, size: '' });
    } else if (sizes.length > 0) {
      for (const s of sizes) combos.push({ color: '', size: s });
    }
    if (combos.length === 0) return;

    const exists = (color: string, size: string) =>
      variants.some(v => v.color.toLowerCase() === color.toLowerCase() && v.size.toLowerCase() === size.toLowerCase());

    const added = combos
      .filter(combo => !exists(combo.color, combo.size))
      .map(combo => ({
        name: '',
        color: combo.color,
        hex: combo.hex,
        size: combo.size,
        sku: '',
        price: '',
        stock: defaultStock || '0',
      }));

    // Drop rows whose color/size was deselected, keep rows that still match
    const kept = variants.filter(v => {
      const colorOk = !v.color || hasColor(v.color) || colors.length === 0;
      const sizeOk = !v.size || sizes.includes(v.size) || sizes.length === 0;
      return colorOk && sizeOk;
    });

    onChange([...kept, ...added]);
  }

  function updateVariant(index: number, key: keyof DraftVariant, value: string) {
    onChange(variants.map((variant, i) => (i === index ? { ...variant, [key]: value } : variant)));
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${active ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-pink-400'}`;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">Available colors</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {COLOR_PRESETS.map(preset => (
            <button key={preset.name} type="button" onClick={() => toggleColor(preset)} className={chip(hasColor(preset.name))}>
              <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 border border-black/15 align-middle" style={{ backgroundColor: preset.hex }} />
              {preset.name}
            </button>
          ))}
          {colors.filter(c => !COLOR_PRESETS.some(p => p.name.toLowerCase() === c.name.toLowerCase())).map(custom => (
            <button key={custom.name} type="button" onClick={() => toggleColor(custom)} className={chip(true)}>
              <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 border border-black/15 align-middle" style={{ backgroundColor: custom.hex }} />
              {custom.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input className="border rounded-lg px-3 py-1.5 text-xs w-40" placeholder="Custom color name" value={customColorName}
            onChange={e => setCustomColorName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomColor())} />
          <input type="color" value={customColorHex} onChange={e => setCustomColorHex(e.target.value)} className="w-9 h-8 border rounded cursor-pointer" title="Pick swatch color" />
          <button type="button" onClick={addCustomColor} className="border px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">Add color</button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-2">Available sizes</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SIZE_PRESETS.map(preset => (
            <button key={preset} type="button" onClick={() => toggleSize(preset)} className={chip(sizes.includes(preset))}>{preset}</button>
          ))}
          {sizes.filter(s => !SIZE_PRESETS.includes(s)).map(custom => (
            <button key={custom} type="button" onClick={() => toggleSize(custom)} className={chip(true)}>{custom}</button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input className="border rounded-lg px-3 py-1.5 text-xs w-40" placeholder="Custom size" value={customSize}
            onChange={e => setCustomSize(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSize())} />
          <button type="button" onClick={addCustomSize} className="border px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">Add size</button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-gray-600">
            Variants ({variants.length}) — per-combo stock, price &amp; SKU
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={generateMatrix} className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
              Generate from colors × sizes
            </button>
            <button type="button" onClick={() => onChange([...variants, { name: '', color: '', size: '', sku: '', price: '', stock: defaultStock || '0' }])} className="border px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">
              + Add row
            </button>
          </div>
        </div>

        {variants.length === 0 ? (
          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            Pick the colors and sizes above, then Generate — one variant per combination is created with its own stock and optional price/SKU.
          </p>
        ) : (
          <div className="space-y-2">
            {variants.map((variant, index) => (
              <div key={variant.id || `${variant.color}-${variant.size}-${index}`} className="grid grid-cols-2 md:grid-cols-7 gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50 items-center">
                <div className="flex items-center gap-1.5 md:col-span-1">
                  {variant.hex && <span className="w-3 h-3 rounded-full border border-black/15 flex-shrink-0" style={{ backgroundColor: variant.hex }} />}
                  <input className="border rounded px-2 py-1.5 text-xs w-full" placeholder="Color" value={variant.color} onChange={(e) => updateVariant(index, 'color', e.target.value)} />
                </div>
                <input className="border rounded px-2 py-1.5 text-xs" placeholder="Size" value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} />
                <input className="border rounded px-2 py-1.5 text-xs" placeholder="Label (optional)" value={variant.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} />
                <input className="border rounded px-2 py-1.5 text-xs" placeholder="SKU" value={variant.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} />
                <input className="border rounded px-2 py-1.5 text-xs" type="number" step="0.01" placeholder="Price $ (opt.)" value={variant.price} onChange={(e) => updateVariant(index, 'price', e.target.value)} />
                <input className="border rounded px-2 py-1.5 text-xs" type="number" placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant(index, 'stock', e.target.value)} />
                <button type="button" onClick={() => removeVariant(index)} className="text-xs text-red-500 hover:text-red-700 border border-red-200 bg-white rounded px-2 py-1.5">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
