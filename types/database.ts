export type UserRole = "customer" | "admin" | "staff";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "upi" | "online" | "card";
export type PaymentStatus = "pending" | "paid" | "failed";
export type DeliveryType = "delivery" | "dine_in" | "takeaway";
export type SpiceLevel = "mild" | "medium" | "spicy" | "extra_spicy";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount_price?: number | null;
  image_url: string;
  is_veg: boolean;
  is_available: boolean;
  is_featured: boolean;
  spice_level?: SpiceLevel | null;
  prep_time_minutes: number;
  calories?: number | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: UserRole;
  avatar_url?: string | null;
  address?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_type: DeliveryType;
  delivery_address?: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  tax: number;
  delivery_fee: number;
  discount: number;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string | null;
  name: string;
  price: number;
  quantity: number;
  item_total: number;
}

export interface Offer {
  id: string;
  code: string;
  description: string;
  discount_percent?: number | null;
  discount_amount?: number | null;
  min_order_amount: number;
  is_active: boolean;
  valid_until?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  menu_item_id: string;
  user_id?: string | null;
  customer_name: string;
  rating: number;
  comment?: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface TableReservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  guest_count: number;
  reservation_date: string;
  reservation_time: string;
  status: "pending" | "confirmed" | "cancelled";
  special_requests?: string | null;
  created_at: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}
