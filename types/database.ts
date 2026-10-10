export type UserRole = "customer" | "admin" | "staff";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "upi" | "online" | "card";
export type PaymentStatus = "pending" | "paid" | "failed";
export type DeliveryType = "delivery" | "dine_in" | "takeaway";
export type SpiceLevel = "mild" | "medium" | "spicy" | "extra_spicy";

// 1. PROFILES
export interface Profile {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  role: UserRole;
  avatar?: string | null;
  avatar_url?: string | null;
  address?: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
}

// 2. CATEGORIES
export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// 3. MENU ITEMS
export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  discount_price?: number | null;
  image?: string;
  image_url: string;
  is_vegetarian?: boolean;
  is_veg: boolean;
  is_available: boolean;
  is_featured: boolean;
  spice_level?: SpiceLevel | null;
  prep_time_minutes?: number;
  calories?: number | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

// 4. ORDERS
export interface Order {
  id: string;
  order_number?: string;
  user_id?: string | null;
  status: OrderStatus;
  order_type?: DeliveryType | string;
  delivery_type?: DeliveryType;
  subtotal: number;
  discount: number;
  tax: number;
  delivery_fee: number;
  total?: number;
  total_amount?: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  delivery_address?: string | null;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

// 5. ORDER ITEMS
export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string | null;
  name?: string;
  quantity: number;
  unit_price?: number;
  price?: number;
  total_price?: number;
  item_total?: number;
}

// 6. ADDRESSES
export interface Address {
  id: string;
  user_id?: string | null;
  label: string; // Home, Work, Other
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
  created_at: string;
}

// 7. PAYMENTS
export interface Payment {
  id: string;
  order_id: string;
  provider: string; // 'cod', 'razorpay', 'upi', 'stripe'
  transaction_id?: string | null;
  amount: number;
  status: PaymentStatus;
  created_at: string;
}

// 8. OFFERS
export interface Offer {
  id: string;
  code: string;
  description: string;
  discount_type?: "percentage" | "flat" | string;
  discount_value?: number;
  discount_percent?: number | null;
  discount_amount?: number | null;
  minimum_order: number;
  min_order_amount?: number;
  max_discount?: number | null;
  start_date?: string;
  end_date?: string | null;
  valid_until?: string | null;
  is_active: boolean;
  created_at: string;
}

// 9. REVIEWS
export interface Review {
  id: string;
  user_id?: string | null;
  order_id?: string | null;
  menu_item_id?: string | null;
  dish_name?: string | null;
  customer_name?: string;
  rating: number; // 1 to 5
  comment?: string | null;
  is_approved: boolean;
  created_at: string;
}

// Cart State
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

// 10. RESTAURANT SETTINGS (PHASE 23)
export interface RestaurantSettings {
  id?: string;
  name: string;
  phone: string;
  phone_secondary?: string;
  email: string;
  address: string;
  opening_hours: string;
  delivery_radius: string;
  minimum_order: number;
  delivery_fee: number;
  tax_percent: number;
  social_links: {
    instagram?: string;
    whatsapp?: string;
    facebook?: string;
    google_maps?: string;
  };
  logo_url: string;
  updated_at?: string;
}
