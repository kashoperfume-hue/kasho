-- ============================================================
-- KASHO — Complete Supabase Database Schema
-- Run this in Supabase SQL Editor (project: zmjatjptlwuuztphbnsd)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── USERS (extends auth.users) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── CATEGORIES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── PRODUCTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  description TEXT,
  short_description TEXT,
  sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_percentage NUMERIC(5, 2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0 NOT NULL,
  is_in_stock BOOLEAN GENERATED ALWAYS AS (stock_quantity > 0) STORED,
  images TEXT[] DEFAULT '{}',
  thumbnail TEXT,
  tags TEXT[] DEFAULT '{}',
  collection_type TEXT CHECK (
    collection_type IN ('mens', 'womens', 'unisex', 'limited-edition', 'new-arrivals', 'best-sellers')
  ),
  is_featured BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  is_limited_edition BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  -- Fragrance details
  top_notes TEXT[] DEFAULT '{}',
  heart_notes TEXT[] DEFAULT '{}',
  base_notes TEXT[] DEFAULT '{}',
  longevity TEXT,
  projection TEXT,
  fragrance_family TEXT,
  volume_ml INTEGER,
  -- Ratings (updated via trigger)
  average_rating NUMERIC(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS products_search_idx ON public.products
  USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products (sku);
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products (category_id);
CREATE INDEX IF NOT EXISTS products_collection_idx ON public.products (collection_type);
CREATE INDEX IF NOT EXISTS products_filters_idx ON public.products
  (is_active, is_featured, is_new_arrival, is_best_seller, is_trending, is_limited_edition);

-- Auto-calculate discount
CREATE OR REPLACE FUNCTION calculate_discount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.original_price > 0 THEN
    NEW.discount_percentage := ROUND(((NEW.original_price - NEW.sale_price) / NEW.original_price) * 100, 2);
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_discount_trigger ON public.products;
CREATE TRIGGER product_discount_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION calculate_discount();

-- ─── REVIEWS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS reviews_product_idx ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON public.reviews (user_id);

-- Update product rating on review change
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        AND is_approved = TRUE
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        AND is_approved = TRUE
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_rating_trigger ON public.reviews;
CREATE TRIGGER reviews_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ─── ADDRESSES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS addresses_user_idx ON public.addresses (user_id);

-- ─── ORDERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (
    status IN (
      'pending', 'payment_pending', 'payment_confirmed', 'processing',
      'packed', 'shipped', 'out_for_delivery', 'delivered',
      'cancelled', 'refunded', 'return_requested', 'returned'
    )
  ),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'upi')),
  payment_status TEXT DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'submitted', 'confirmed', 'failed', 'refunded')
  ),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  shipping_charge NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  coupon_code TEXT,
  shipping_address JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_number_idx ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS orders_created_idx ON public.orders (created_at DESC);

-- ─── ORDER ITEMS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id);

-- ─── PAYMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cod', 'upi')),
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'submitted', 'confirmed', 'failed', 'refunded')
  ),
  upi_id TEXT,
  transaction_ref TEXT,
  screenshot_url TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS payments_order_idx ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON public.payments (status);

-- ─── TRACKING ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tracking_number TEXT,
  courier_name TEXT,
  tracking_url TEXT,
  shiprocket_order_id TEXT,
  shiprocket_shipment_id TEXT,
  status TEXT DEFAULT 'pending',
  estimated_delivery DATE,
  updates JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS tracking_order_idx ON public.tracking (order_id);

-- ─── CART ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS cart_user_idx ON public.cart (user_id);

-- ─── WISHLIST ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlist_user_idx ON public.wishlist (user_id);

-- ─── COUPONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_shipping')),
  value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  min_order_value NUMERIC(10, 2) DEFAULT 0,
  max_discount NUMERIC(10, 2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── BANNERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  link_url TEXT,
  button_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── MEMBERSHIPS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'silver', 'gold', 'platinum')),
  points INTEGER DEFAULT 0,
  total_spent NUMERIC(10, 2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ
);

-- ─── SETTINGS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── STORAGE BUCKETS ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('products', 'products', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('banners', 'banners', true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('payment-proofs', 'payment-proofs', false, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('reviews', 'reviews', true, 10485760, ARRAY['image/jpeg','image/png','image/webp']),
  ('qr-codes', 'qr-codes', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ─── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- PRODUCTS policies (public read)
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- CATEGORIES policies (public read)
CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- REVIEWS policies
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage reviews" ON public.reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ADDRESSES policies
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

-- ORDERS policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ORDER_ITEMS policies
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );
CREATE POLICY "Admins can manage all order items" ON public.order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- PAYMENTS policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- TRACKING policies
CREATE POLICY "Users can view own tracking" ON public.tracking
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );
CREATE POLICY "Admins can manage tracking" ON public.tracking
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- CART policies
CREATE POLICY "Users can manage own cart" ON public.cart
  FOR ALL USING (auth.uid() = user_id);

-- WISHLIST policies
CREATE POLICY "Users can manage own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id);

-- COUPONS policies (public read for validation)
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- BANNERS policies (public read)
CREATE POLICY "Anyone can view active banners" ON public.banners
  FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage banners" ON public.banners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- MEMBERSHIPS policies
CREATE POLICY "Users can view own membership" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage memberships" ON public.memberships
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- SETTINGS policies (public read for storefront settings)
CREATE POLICY "Anyone can read settings" ON public.settings
  FOR SELECT USING (TRUE);
CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- Storage policies
CREATE POLICY "Products images are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Banners are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Avatars are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "QR codes are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'qr-codes');
CREATE POLICY "Review images are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'reviews');
CREATE POLICY "Users can upload avatars" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can upload review images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reviews' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can upload payment proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage all storage" ON storage.objects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- ─── SEED DATA ─────────────────────────────────────────────

-- Categories
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Men''s Collection', 'mens', 'Bold, sophisticated fragrances crafted for the modern man', 1),
  ('Women''s Collection', 'womens', 'Elegant, alluring scents that define feminine luxury', 2),
  ('Unisex Collection', 'unisex', 'Boundary-defying fragrances for everyone', 3),
  ('Limited Edition', 'limited-edition', 'Rare, exclusive fragrances available for a short time', 4),
  ('Floral', 'floral', 'Fresh, romantic floral compositions', 5),
  ('Woody', 'woody', 'Deep, earthy woody fragrances', 6),
  ('Oriental', 'oriental', 'Rich, exotic oriental accords', 7),
  ('Fresh & Citrus', 'fresh-citrus', 'Light, energizing fresh scents', 8)
ON CONFLICT (slug) DO NOTHING;

-- Default Settings
INSERT INTO public.settings (key, value) VALUES
  ('upi', '{"upi_id": "kasho@upi", "qr_url": null, "instructions": "Pay to the UPI ID above or scan the QR code. After payment, enter your UPI transaction reference and upload the payment screenshot.", "is_active": true}'),
  ('shipping', '{"free_shipping_above": 999, "standard_rate": 99, "express_rate": 199}'),
  ('membership', '{"silver_min_spend": 5000, "gold_min_spend": 15000, "platinum_min_spend": 30000, "points_per_rupee": 1, "points_redemption_rate": 100}'),
  ('store', '{"name": "Kasho", "email": "hello@kasho.in", "phone": "+91-XXXXXXXXXX", "instagram": "@kasho.perfumes", "tagline": "Wear your story"}'),
  ('shiprocket', '{"enabled": false, "default_length": 10, "default_breadth": 10, "default_height": 10, "default_weight": 0.3}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Sample products (5 products to start)
INSERT INTO public.products (
  name, slug, sku, category_id, description, short_description,
  sale_price, original_price, stock_quantity,
  images, thumbnail, tags, collection_type,
  is_featured, is_new_arrival, is_best_seller, is_trending,
  top_notes, heart_notes, base_notes,
  longevity, projection, fragrance_family, volume_ml
) VALUES
(
  'Noir Séduction', 'noir-seduction',
  'MSNOIRSE001',
  (SELECT id FROM public.categories WHERE slug = 'mens'),
  'A bold, masculine fragrance that opens with spiced bergamot and black pepper, transitions into a heart of smoky vetiver and cedarwood, and settles into a rich base of amberwood and musk. For the man who commands presence.',
  'Bold and magnetic — dark woods, spice, and deep musk',
  2499, 3499, 50,
  ARRAY[]::TEXT[], NULL,
  ARRAY['woody', 'spicy', 'masculine', 'evening', 'date-night'],
  'mens', TRUE, TRUE, FALSE, TRUE,
  ARRAY['Black Pepper', 'Bergamot', 'Cardamom'],
  ARRAY['Vetiver', 'Cedarwood', 'Iris'],
  ARRAY['Amberwood', 'Musk', 'Benzoin'],
  '8-10 hours', 'Strong', 'Woody Oriental', 100
),
(
  'Rose Lumière', 'rose-lumiere',
  'WSROSLUMI002',
  (SELECT id FROM public.categories WHERE slug = 'womens'),
  'A luminous floral that blooms with Turkish rose and peony, softened by a powdery iris heart, and anchored by warm sandalwood and creamy musk. Feminine, radiant, unforgettable.',
  'Radiant rose with soft powder and warm sandalwood',
  2999, 3999, 35,
  ARRAY[]::TEXT[], NULL,
  ARRAY['floral', 'feminine', 'romantic', 'daytime', 'gifting'],
  'womens', TRUE, FALSE, TRUE, FALSE,
  ARRAY['Turkish Rose', 'Pink Pepper', 'Lychee'],
  ARRAY['Peony', 'Iris', 'Magnolia'],
  ARRAY['Sandalwood', 'Musk', 'White Amber'],
  '6-8 hours', 'Moderate', 'Floral', 100
),
(
  'Oud Céleste', 'oud-celeste',
  'USOUDCELE003',
  (SELECT id FROM public.categories WHERE slug = 'unisex'),
  'A luxurious oud fragrance for those who dare to be different. Smoky, rich, and deeply sensual — this is not a fragrance, it is a statement.',
  'Rich oud with smoky depth and sweet vanilla',
  3999, 5499, 20,
  ARRAY[]::TEXT[], NULL,
  ARRAY['oud', 'oriental', 'unisex', 'luxury', 'statement'],
  'unisex', FALSE, FALSE, TRUE, TRUE,
  ARRAY['Oud', 'Saffron', 'Rose'],
  ARRAY['Labdanum', 'Jasmine', 'Patchouli'],
  ARRAY['Vanilla', 'Musk', 'Sandalwood'],
  '12+ hours', 'Very Strong', 'Oriental Woody', 50
),
(
  'Aurore Blanche', 'aurore-blanche',
  'WSAUROBLA004',
  (SELECT id FROM public.categories WHERE slug = 'limited-edition'),
  'A limited edition masterpiece — crisp morning air over white florals, warmed by soft cashmere and a whisper of vanilla. Only 200 bottles produced.',
  'Limited edition — morning dew, white florals, cashmere',
  4999, 6999, 15,
  ARRAY[]::TEXT[], NULL,
  ARRAY['limited-edition', 'exclusive', 'floral', 'cashmere', 'rare'],
  'limited-edition', TRUE, TRUE, FALSE, FALSE,
  ARRAY['Bergamot', 'White Tea', 'Cucumber'],
  ARRAY['White Rose', 'Lily of the Valley', 'Muguet'],
  ARRAY['Cashmere', 'Vanilla', 'White Musk'],
  '8-10 hours', 'Moderate', 'Floral Gourmand', 100
),
(
  'Verdure Libre', 'verdure-libre',
  'USVERDLIB005',
  (SELECT id FROM public.categories WHERE slug = 'unisex'),
  'A forest walk distilled into a bottle. Bright green herbs and citrus open into a green-floral heart, grounded by mossy oak and earthy vetiver. Freedom in a fragrance.',
  'Green, herbal, and earthy — nature bottled',
  1999, 2799, 60,
  ARRAY[]::TEXT[], NULL,
  ARRAY['green', 'fresh', 'earthy', 'unisex', 'casual'],
  'unisex', FALSE, TRUE, FALSE, TRUE,
  ARRAY['Lemon', 'Basil', 'Green Apple'],
  ARRAY['Violet Leaf', 'Galbanum', 'Geranium'],
  ARRAY['Vetiver', 'Oak Moss', 'Cedar'],
  '6-8 hours', 'Soft', 'Green Aromatic', 100
)
ON CONFLICT (slug) DO NOTHING;

-- ─── ADMIN USER SETUP ──────────────────────────────────────
-- After creating your admin account via the app, run this to grant admin:
-- UPDATE public.users SET is_admin = TRUE WHERE email = 'your-admin-email@example.com';

COMMENT ON TABLE public.users IS 'Extended user profiles linked to Supabase auth';
COMMENT ON TABLE public.products IS 'Kasho perfume product catalog';
COMMENT ON TABLE public.orders IS 'Customer orders with shipping and payment info';
COMMENT ON TABLE public.settings IS 'Dynamic store settings (UPI, shipping, etc.)';
