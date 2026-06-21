import type { Category, Product } from './types';

export const sampleProducts: Product[] = [
  {
    id: 'sierra-knit-pullover',
    category: 'Women',
    name: 'Sierra Knit Pullover',
    description: 'A cozy, elevated knit pullover crafted for effortless layering and everyday warmth.',
    price: 84,
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
    stock: 18,
    link: 'https://pinkhalo.co/women/sierra-knit-pullover',
    profitMargin: 26
  },
  {
    id: 'atlas-trainer-sneakers',
    category: 'Men',
    name: 'Atlas Trainer Sneakers',
    description: 'Lightweight performance sneakers with a clean silhouette and durable outsole.',
    price: 108,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    stock: 14,
    link: 'https://pinkhalo.co/men/atlas-trainer-sneakers',
    profitMargin: 30
  },
  {
    id: 'meadow-mini-romper',
    category: 'Children',
    name: 'Meadow Mini Romper',
    description: 'Soft and playful romper designed for easy movement and everyday exploration.',
    price: 36,
    imageUrl: 'https://images.unsplash.com/photo-1516841273335-e39b378881a4?auto=format&fit=crop&w=900&q=80',
    stock: 22,
    link: 'https://pinkhalo.co/children/meadow-mini-romper',
    profitMargin: 24
  },
  {
    id: 'luna-plush-pet-bed',
    category: 'Pets',
    name: 'Luna Plush Pet Bed',
    description: 'Ultra-soft pet bed with supportive cushioning for restful naps and lounge time.',
    price: 46,
    imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80',
    stock: 12,
    link: 'https://pinkhalo.co/pets/luna-plush-pet-bed',
    profitMargin: 18
  }
];

const productKey = 'pink-halo-products';

export function loadProducts(): Product[] {
  try {
    const stored = localStorage.getItem(productKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Product[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Error loading products from localStorage', error);
  }
  return sampleProducts;
}

export function saveProducts(products: Product[]) {
  try {
    localStorage.setItem(productKey, JSON.stringify(products));
  } catch (error) {
    console.warn('Error saving products to localStorage', error);
  }
}

export function getCategories(): Category[] {
  return ['Men', 'Women', 'Children', 'Pets'];
}
