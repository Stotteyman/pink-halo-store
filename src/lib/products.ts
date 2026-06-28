import type { Category, Product } from './types';

export const sampleProducts: Product[] = [];

const productKey = 'pink-halo-products';

export function loadProducts(): Product[] {
  // Do not expose local or placeholder inventory as sellable merchandise.
  // Replace this with a database query that returns published products only.
  return [];
}

export function saveProducts(products: Product[]) {
  try {
    localStorage.setItem(productKey, JSON.stringify(products));
  } catch (error) {
    console.warn('Error saving products to localStorage', error);
  }
}

export function getCategories(): Category[] {
  return ['Dresses', 'Tops', 'Lounge', 'Accessories', 'Sale'];
}
