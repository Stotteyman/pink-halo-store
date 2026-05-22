export type Category = 'Men' | 'Women' | 'Children' | 'Pets';

export interface Product {
  id: string;
  category: Category;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  link: string;
  profitMargin: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface InventorySummary {
  totalStock: number;
  productCount: number;
  totalProfit: number;
}
