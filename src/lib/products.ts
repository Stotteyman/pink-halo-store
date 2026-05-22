import type { Category, Product } from './types';

export const sampleProducts: Product[] = [
  {
    id: 'halo-soft-sweater',
    category: 'Women',
    name: 'Halo Soft Sweater',
    description: 'Cloud-soft knitwear with a polished look for any season.',
    price: 82,
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
    stock: 18,
    link: 'https://pinkhalo.co/women/halo-soft-sweater',
    profitMargin: 26
  },
  {
    id: 'night-run-sneakers',
    category: 'Men',
    name: 'Night Run Sneakers',
    description: 'Bold street-ready sneakers designed for comfort and all-day energy.',
    price: 98,
    imageUrl: 'https://images.unsplash.com/photo-1519741498824-2ee1d0deac0e?auto=format&fit=crop&w=900&q=80',
    stock: 14,
    link: 'https://pinkhalo.co/men/night-run-sneakers',
    profitMargin: 30
  },
  {
    id: 'cloud-play-onesie',
    category: 'Children',
    name: 'Cloud Play Onesie',
    description: 'Stretchy and breathable for toddlers who stay in motion.',
    price: 34,
    imageUrl: 'https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80',
    stock: 22,
    link: 'https://pinkhalo.co/children/cloud-play-onesie',
    profitMargin: 24
  },
  {
    id: 'pet-galaxy-bed',
    category: 'Pets',
    name: 'Galaxy Pet Bed',
    description: 'Ultra-plush resting space for cats and small dogs.',
    price: 44,
    imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80',
    stock: 12,
    link: 'https://pinkhalo.co/pets/galaxy-bed',
    profitMargin: 18
  }
];

const productKey = 'pink-halo-products';

export function loadProducts(): Product[] {
  try {
    const stored = localStorage.getItem(productKey);
    if (stored) {
      return JSON.parse(stored) as Product[];
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
