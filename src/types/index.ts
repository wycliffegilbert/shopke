export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'vendor';
  avatar?: string;
  is_email_verified: boolean;
  last_login?: string;
  created_at: string;
  addresses?: Address[];
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  county: string;
  postal_code?: string;
  is_default: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: string;
  product_count: number;
  is_active: boolean;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price_modifier: number;
  stock_quantity: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  meta_title?: string;
  meta_description?: string;
  category_id?: string;
  category_name?: string;
  category_slug?: string;
  brand?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  average_rating: number;
  review_count: number;
  sold_count: number;
  tags?: string[];
  images?: ProductImage[];
  primary_image?: string;
  variants?: ProductVariant[];
  related_products?: Product[];
  created_at: string;
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  image?: string;
  quantity: number;
  stock_quantity: number;
  variant_id?: string;
  variant_name?: string;
  variant_value?: string;
  price_modifier?: number;
  effective_price: number;
  subtotal: number;
}

export interface CartSummary {
  items: CartItem[];
  summary: {
    subtotal: number;
    shipping: number;
    discount?: number;
    total: number;
    item_count: number;
  };
}

export interface WishlistItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  image?: string;
  average_rating: number;
  stock_quantity: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product_id?: string;
  product_name: string;
  product_image?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant_info?: Record<string, string>;
}

export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing'
  | 'shipped' | 'out_for_delivery' | 'delivered'
  | 'cancelled' | 'refunded';

export type PaymentStatus = 'unpaid' | 'paid' | 'partially_paid' | 'refunded';
export type PaymentMethod = 'mpesa' | 'stripe' | 'paypal' | 'cod';

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  shipping_amount: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  coupon_code?: string;
  shipping_address: Address;
  billing_address?: Address;
  notes?: string;
  tracking_number?: string;
  tracking_url?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  cancelled_at?: string;
  items?: OrderItem[];
  customer?: User;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  body?: string;
  images?: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  reviewer_name: string;
  reviewer_avatar?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  expires_at?: string;
  calculated_discount?: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  button_text?: string;
  position: string;
}

export interface DashboardMetrics {
  total_sales: number;
  monthly_sales: number;
  sales_growth: number;
  total_orders: number;
  pending_orders: number;
  this_month_orders: number;
  total_customers: number;
  new_customers: number;
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: { field: string; message: string }[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  featured?: boolean;
  new_arrival?: boolean;
  best_seller?: boolean;
  sale?: boolean;
  in_stock?: boolean;
  page?: number;
  limit?: number;
}
