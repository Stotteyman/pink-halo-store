// ── Storefront types ──────────────────────────────────────────────────────────
export type Category = 'Dresses' | 'Tops' | 'Lounge' | 'Accessories' | 'Sale';

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
  totalValue: number;
}

// ── PinkHalo admin/backend types (pinkhalo schema) ───────────────────────────

export type ProductStatus = 'draft' | 'active' | 'archived';
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'refunded' | 'cancelled';
export type ManufacturerStatus = 'prospect' | 'contacted' | 'sampling' | 'active' | 'inactive';

export interface PHCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  created_at: string;
}

export interface PHProductVariant {
  id: string;
  product_id: string;
  name: string;
  options: Record<string, string>;
  price?: number;
  cost?: number;
  stock: number;
  sku?: string;
  created_at: string;
}

export interface PHProduct {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  category_id?: string;
  manufacturer_id?: string;
  fulfillment_method?: 'unassigned' | 'in_house' | 'manufacturer' | 'print_on_demand' | 'dropship';
  manufacturer_sku?: string;
  price: number;
  compare_at_price?: number;
  cost?: number;
  sku?: string;
  stock: number;
  low_stock_threshold: number;
  images: string[];
  tags: string[];
  status: ProductStatus;
  stripe_product_id?: string;
  stripe_price_id?: string;
  weight_oz?: number;
  shipping_lead_days?: number;
  created_at: string;
  updated_at: string;
  categories?: Pick<PHCategory, 'name' | 'slug'>;
  product_variants?: PHProductVariant[];
}

export interface PHOrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  price: number;
  quantity: number;
  image_url?: string;
  manufacturer_id?: string;
  fulfillment_status?: 'unassigned' | 'pending' | 'submitted' | 'in_production' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
  fulfillment_reference?: string;
  shipped_at?: string;
  delivered_at?: string;
}

export interface PHOrder {
  id: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
  status: OrderStatus;
  customer_email?: string;
  customer_name?: string;
  shipping_address: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  tracking_number?: string;
  tracking_carrier?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items?: PHOrderItem[];
}

export interface PHManufacturer {
  id: string;
  name: string;
  website?: string;
  contact_email?: string;
  phone?: string;
  country?: string;
  moq?: number;
  lead_time_days?: number;
  category?: string;
  notes?: string;
  rating?: number;
  tags?: string[];
  status: ManufacturerStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderSummary {
  total_orders: number;
  total_revenue: number;
  by_status: Record<string, number>;
}
