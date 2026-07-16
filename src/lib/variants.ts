// Shared color/size vocabulary for product variants. Admin stores the chosen
// hex in variant options so the storefront can render swatches without a map,
// but colorHex() covers older variants that only have a name.

export interface StorefrontVariant {
  id: string;
  name: string;
  color?: string;
  size?: string;
  hex?: string;
  price?: number;
  stock: number;
  sku?: string;
}

export const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Black', hex: '#2B2226' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Cream', hex: '#F3EAE0' },
  { name: 'Blush', hex: '#F4C6CF' },
  { name: 'Pink', hex: '#E48FA8' },
  { name: 'Rose', hex: '#B4707E' },
  { name: 'Dusty Rose', hex: '#D8A7B1' },
  { name: 'Mauve', hex: '#B784A7' },
  { name: 'Red', hex: '#B3273B' },
  { name: 'Burgundy', hex: '#6E1F2E' },
  { name: 'Brown', hex: '#6B4A3A' },
  { name: 'Leopard', hex: '#8A5A2B' },
  { name: 'Tan', hex: '#C9A886' },
  { name: 'Grey', hex: '#9A9AA0' },
  { name: 'Navy', hex: '#2B3050' },
  { name: 'Sage', hex: '#A8B5A0' },
  { name: 'Lavender', hex: '#C3B1D0' },
  { name: 'Gold', hex: '#C9A36B' },
  { name: 'Silver', hex: '#C0C0C8' },
];

export const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'One Size'];

export function colorHex(name?: string): string | undefined {
  if (!name) return undefined;
  return COLOR_PRESETS.find((c) => c.name.toLowerCase() === name.toLowerCase())?.hex;
}

export function variantLabel(variant: Pick<StorefrontVariant, 'color' | 'size' | 'name'>): string {
  return [variant.color, variant.size].filter(Boolean).join(' / ') || variant.name;
}

// Cart keys carry the chosen variant: "productId" or "productId::variantId"
export function cartKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

export function parseCartKey(key: string): { productId: string; variantId?: string } {
  const [productId, variantId] = key.split('::');
  return { productId, variantId: variantId || undefined };
}
