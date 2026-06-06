// ============================================================
// KASHO — Global TypeScript Types
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── User / Auth ───────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  membership_tier: MembershipTier;
  created_at: string;
  updated_at: string;
}

export type MembershipTier = "free" | "silver" | "gold" | "platinum";

// ─── Category ──────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export type CollectionType =
  | "mens"
  | "womens"
  | "unisex"
  | "limited-edition"
  | "new-arrivals"
  | "best-sellers";

// ─── Product ───────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string | null;
  category?: Category;
  description: string | null;
  short_description: string | null;
  sale_price: number;
  original_price: number;
  discount_percentage: number;
  stock_quantity: number;
  is_in_stock: boolean;
  images: string[];
  thumbnail: string | null;
  tags: string[];
  collection_type: CollectionType | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_trending: boolean;
  is_limited_edition: boolean;
  is_active: boolean;
  // Fragrance details
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];
  longevity: string | null;
  projection: string | null;
  fragrance_family: string | null;
  volume_ml: number | null;
  // Ratings
  average_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  url: string;
  alt: string;
  is_primary: boolean;
}

// ─── Cart ──────────────────────────────────────────────────
export interface CartItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  user_id: string | null;
  session_id: string | null;
  created_at: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon?: Coupon;
}

// Local cart state (Zustand)
export interface LocalCartItem {
  product: Product;
  quantity: number;
}

// ─── Wishlist ──────────────────────────────────────────────
export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

// ─── Address ───────────────────────────────────────────────
export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
}

// ─── Order ─────────────────────────────────────────────────
export type OrderStatus =
  | "pending"
  | "payment_pending"
  | "payment_confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "return_requested"
  | "returned";

export type PaymentMethod = "cod" | "upi";
export type PaymentStatus = "pending" | "submitted" | "confirmed" | "failed" | "refunded";

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  user?: UserProfile;
  items: OrderItem[];
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  discount: number;
  shipping_charge: number;
  total: number;
  coupon_code: string | null;
  shipping_address: Address;
  tracking?: TrackingInfo;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ─── Payment ───────────────────────────────────────────────
export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  upi_id: string | null;
  transaction_ref: string | null;
  screenshot_url: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface UpiSettings {
  upi_id: string;
  qr_url: string | null;
  instructions: string;
  is_active: boolean;
}

// ─── Tracking ──────────────────────────────────────────────
export interface TrackingInfo {
  id: string;
  order_id: string;
  tracking_number: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  status: OrderStatus;
  estimated_delivery: string | null;
  updates: TrackingUpdate[];
  created_at: string;
  updated_at: string;
}

export interface TrackingUpdate {
  status: string;
  message: string;
  timestamp: string;
  location: string | null;
}

// ─── Review ────────────────────────────────────────────────
export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user?: UserProfile;
  rating: number;
  title: string | null;
  body: string;
  images: string[];
  is_verified_purchase: boolean;
  is_approved: boolean;
  is_featured: boolean;
  helpful_count: number;
  created_at: string;
}

// ─── Coupon ────────────────────────────────────────────────
export type CouponType = "percentage" | "fixed" | "free_shipping";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// ─── Banner ────────────────────────────────────────────────
export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  button_text: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ─── Membership ────────────────────────────────────────────
export interface Membership {
  id: string;
  user_id: string;
  tier: MembershipTier;
  points: number;
  total_spent: number;
  joined_at: string;
  expires_at: string | null;
}

// ─── Settings ──────────────────────────────────────────────
export interface Settings {
  id: string;
  key: string;
  value: Json;
  updated_at: string;
}

// ─── Shiprocket ────────────────────────────────────────────
export interface ShiprocketOrder {
  order_id: string;
  order_date: string;
  channel_id: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_country: string;
  billing_pin_code: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: ShiprocketItem[];
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ShiprocketItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
}

// ─── API Responses ─────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ─── Filters ───────────────────────────────────────────────
export interface ProductFilters {
  category?: string;
  collection?: CollectionType;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  is_trending?: boolean;
  tags?: string[];
  search?: string;
  sort?: ProductSortOption;
  page?: number;
  per_page?: number;
}

export type ProductSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular"
  | "rating"
  | "trending";

// ─── Admin Analytics ───────────────────────────────────────
export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  orders_today: number;
  revenue_today: number;
  pending_orders: number;
  low_stock_products: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
  thumbnail: string | null;
}

// ─── Pincode ───────────────────────────────────────────────
export interface PincodeData {
  pincode: string;
  city: string;
  state: string;
  district: string;
  post_offices: string[];
}

// ─── Checkout Form ─────────────────────────────────────────
export interface CheckoutFormData {
  full_name: string;
  phone: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  save_address: boolean;
  payment_method: PaymentMethod;
  upi_transaction_ref?: string;
  payment_screenshot?: File;
  notes?: string;
  coupon_code?: string;
}
