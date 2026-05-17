export type RestaurantMode = "table" | "foodcourt";
export type OrderStatus = "new" | "preparing" | "ready" | "delivered" | "cancelled";

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  address: string | null;
  mode: RestaurantMode;
  active: boolean;
  created_at: string;
}

export interface Table {
  id: string;
  restaurant_id: string;
  branch_id?: string;
  zone_id?: string | null;
  capacity?: number;
  number: number;
  label: string;
  qr_url: string | null;
  active: boolean;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

export interface Product {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  sort_order: number;
}

export interface ModifierGroup {
  id: string;
  product_id: string;
  name: string;
  required: boolean;
  max_selections: number;
  modifiers?: Modifier[];
}

export interface Modifier {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_ci: string | null;
  mode: RestaurantMode;
  status: OrderStatus;
  source?: string | null;
  branch_id?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  tables?: { number: number; label: string | null } | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  order_item_modifiers?: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: string;
  order_item_id: string;
  modifier_name: string;
  price_delta: number;
}

export interface Review {
  id: string;
  restaurant_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export type CategoryWithProducts = Category & { products: Product[] };
