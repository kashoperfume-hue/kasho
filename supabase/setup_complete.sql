-- ============================================================
-- KASHO — Complete Supabase Setup
-- Step 1: Run this entire file in Supabase SQL Editor
-- Step 2: See instructions at bottom for Admin setup
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── USERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  membership_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── CATEGORIES ─────────────────────────────────────────────
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
  top_notes TEXT[] DEFAULT '{}',
  heart_notes TEXT[] DEFAULT '{}',
  base_notes TEXT[] DEFAULT '{}',
  longevity TEXT,
  projection TEXT,
  fragrance_family TEXT,
  volume_ml INTEGER,
  average_rating NUMERIC(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);
CREATE INDEX IF NOT EXISTS products_filters_idx ON public.products
  (is_active, is_featured, is_new_arrival, is_best_seller, is_trending);

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

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) FROM public.reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = TRUE
    ),
    review_count = (
      SELECT COUNT(*) FROM public.reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) AND is_approved = TRUE
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

-- ─── ORDERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (
    status IN ('pending','payment_pending','payment_confirmed','processing',
               'packed','shipped','out_for_delivery','delivered',
               'cancelled','refunded','return_requested','returned')
  ),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'upi')),
  payment_status TEXT DEFAULT 'pending' CHECK (
    payment_status IN ('pending','submitted','confirmed','failed','refunded')
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

-- ─── PAYMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cod', 'upi')),
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending','submitted','confirmed','failed','refunded')
  ),
  upi_id TEXT,
  transaction_ref TEXT,
  screenshot_url TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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

-- ─── WISHLIST ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- ─── COUPONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
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
  image_url TEXT,
  link_href TEXT,
  link_label TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── RLS POLICIES ──────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking ENABLE ROW LEVEL SECURITY;

-- Users: view own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- Products: public read, admin write
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = TRUE OR
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- Categories: public read
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- Orders: own orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- Order items
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
CREATE POLICY "Users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items" ON public.order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- Addresses
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

-- Payments
DROP POLICY IF EXISTS "Users can manage own payments" ON public.payments;
CREATE POLICY "Users can manage own payments" ON public.payments
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- Reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Logged in users can create reviews" ON public.reviews;
CREATE POLICY "Logged in users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- Cart
DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart;
CREATE POLICY "Users can manage own cart" ON public.cart
  FOR ALL USING (auth.uid() = user_id);

-- Wishlist
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Banners: public read
DROP POLICY IF EXISTS "Anyone can view banners" ON public.banners;
CREATE POLICY "Anyone can view banners" ON public.banners
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
CREATE POLICY "Admins can manage banners" ON public.banners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- Coupons: public read active
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- Tracking
DROP POLICY IF EXISTS "Users can view own tracking" ON public.tracking;
CREATE POLICY "Users can view own tracking" ON public.tracking
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage tracking" ON public.tracking;
CREATE POLICY "Admins can manage tracking" ON public.tracking
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = TRUE)
  );

-- ─── SAMPLE CATEGORIES ─────────────────────────────────────
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Men''s', 'mens', 'Bold fragrances for men', 1),
  ('Women''s', 'womens', 'Elegant fragrances for women', 2),
  ('Unisex', 'unisex', 'Fragrances for everyone', 3),
  ('Limited Edition', 'limited-edition', 'Rare exclusive fragrances', 4)
ON CONFLICT (slug) DO NOTHING;

-- ─── SAMPLE PRODUCTS ───────────────────────────────────────
INSERT INTO public.products (
  name, slug, sku, description, short_description,
  sale_price, original_price, stock_quantity,
  collection_type, is_featured, is_new_arrival, is_best_seller, is_trending, is_active,
  top_notes, heart_notes, base_notes,
  longevity, projection, fragrance_family, volume_ml, average_rating, review_count,
  tags
) VALUES

('Oud Al Layl', 'oud-al-layl', 'KSH-OAL-001',
 'Raat ki khamoshi mein dooba ek gehri aur kashishdar khushbu. Oud Al Layl ek musafari hai jinnat ki duniya mein — jahan andhera bhi khushboodar hota hai.',
 'Raatri Oud — Gehri, Kashishdar, Dil ko chhone wali.',
 1499, 2199, 50,
 'mens', TRUE, FALSE, TRUE, TRUE, TRUE,
 ARRAY['Bergamot', 'Saffron', 'Black Pepper'],
 ARRAY['Rose', 'Oud', 'Jasmine'],
 ARRAY['Sandalwood', 'Amber', 'Musk'],
 '10-12 ghante', 'Strong', 'Oriental Woody', 100, 4.8, 124,
 ARRAY['oud', 'luxury', 'night', 'mens']),

('Gulab Malika', 'gulab-malika', 'KSH-GM-002',
 'Gulabi baagon ki taaza subah. Gulab Malika ek nazuk lekin maza-dar attar hai jo dil ko khush karta hai aur dimagh ko taza rakhta hai.',
 'Phoolon ki Rani — Taazi, Nazuk, Dil ko Lubhane wali.',
 1299, 1799, 40,
 'womens', TRUE, TRUE, FALSE, TRUE, TRUE,
 ARRAY['Pink Pepper', 'Lychee', 'Bergamot'],
 ARRAY['Rose', 'Peony', 'Iris'],
 ARRAY['White Musk', 'Cedarwood', 'Patchouli'],
 '8-10 ghante', 'Moderate', 'Floral', 100, 4.9, 89,
 ARRAY['rose', 'floral', 'womens', 'luxury']),

('Musk-e-Urooj', 'musk-e-urooj', 'KSH-MEU-003',
 'Yeh khushbu na sirf ek attar hai — yeh ek ahsas hai. Musk ki gehrayi aur vanilla ki milaas isko ek aisa tajruba banati hai jo yaad rahta hai.',
 'Unisex Musk — Gehri, Dil ko chhoti, Har waqt ke liye.',
 1199, 1599, 60,
 'unisex', FALSE, TRUE, TRUE, FALSE, TRUE,
 ARRAY['Cardamom', 'Mandarin', 'Aldehydes'],
 ARRAY['Musk', 'Violet', 'Orris'],
 ARRAY['Vanilla', 'Amber', 'Benzoin'],
 '10-12 ghante', 'Moderate', 'Musky Oriental', 100, 4.7, 156,
 ARRAY['musk', 'unisex', 'vanilla', 'everyday']),

('Zafran-e-Shahi', 'zafran-e-shahi', 'KSH-ZES-004',
 'Shahi darbar ki yaad dilata yeh attar zafaraan ki keemat aur oud ki gehrayi ka behtareen milaap hai. Sirf khaas logon ke liye.',
 'Shaahi Zafaraan — Naayab, Beshqeemat, Sirf Khaas Logon ke Liye.',
 2499, 3499, 20,
 'limited-edition', TRUE, TRUE, FALSE, TRUE, TRUE,
 ARRAY['Saffron', 'Cinnamon', 'Grapefruit'],
 ARRAY['Rose', 'Oud', 'Jasmine', 'Incense'],
 ARRAY['Sandalwood', 'Amber', 'Labdanum', 'Musk'],
 '12+ ghante', 'Very Strong', 'Oriental Spicy', 50, 5.0, 43,
 ARRAY['saffron', 'oud', 'limited', 'luxury', 'royal']),

('Baarish Ki Khushbu', 'baarish-ki-khushbu', 'KSH-BKK-005',
 'Pehli baarish ka woh anokha mehka. Mitti ki sondhi khushbu jo dil mein uttar jaati hai — Baarish Ki Khushbu wohi ehsaas hai.',
 'Mitti aur Baarish — Taazi, Mitti, Dil ko sukoon dene wali.',
 999, 1399, 75,
 'unisex', FALSE, TRUE, FALSE, TRUE, TRUE,
 ARRAY['Petrichor', 'Green Tea', 'Citrus'],
 ARRAY['Vetiver', 'Geranium', 'Violet Leaf'],
 ARRAY['Earthy Musk', 'Cedarwood', 'Patchouli'],
 '6-8 ghante', 'Light', 'Earthy Aromatic', 100, 4.6, 201,
 ARRAY['petrichor', 'earthy', 'fresh', 'unisex']),

('Amber Raat', 'amber-raat', 'KSH-AR-006',
 'Raat ke sannate mein amber ki warm aur mitha khushbu. Amber Raat aik aise safar ki tarah hai jo khatam hi nahi hona chahte.',
 'Warm Amber — Meetha, Warm, Dil ko sukoon dene wala.',
 1399, 1899, 35,
 'womens', FALSE, FALSE, TRUE, FALSE, TRUE,
 ARRAY['Bergamot', 'Orange Blossom', 'Pink Pepper'],
 ARRAY['Amber', 'Rose', 'Heliotrope'],
 ARRAY['Vanilla', 'Musk', 'Benzoin', 'Labdanum'],
 '10-12 ghante', 'Moderate', 'Oriental Floral', 100, 4.8, 67,
 ARRAY['amber', 'warm', 'womens', 'evening']),

('Cedar Warrior', 'cedar-warrior', 'KSH-CW-007',
 'Jungle ki tazgi aur cedar ki mazbooti ka sangam. Cedar Warrior ek aisa mard ka attar hai jo khud bolne ki zaroorat nahi rakhta.',
 'Woody Masculine — Mazboot, Taza, Asal Mard ke Liye.',
 1199, 1699, 45,
 'mens', FALSE, FALSE, TRUE, TRUE, TRUE,
 ARRAY['Lime', 'Grapefruit', 'Black Pepper'],
 ARRAY['Cedarwood', 'Lavender', 'Nutmeg'],
 ARRAY['Vetiver', 'Sandalwood', 'Oakmoss', 'Musk'],
 '8-10 ghante', 'Moderate', 'Woody Aromatic', 100, 4.5, 88,
 ARRAY['cedar', 'woody', 'mens', 'masculine']),

('Yasmin Dreams', 'yasmin-dreams', 'KSH-YD-008',
 'Chandni raat mein khilne wale yasmin ke phool ki tarah — meetha, nazuk, aur dil ko chhone wala. Yasmin Dreams ek khwaab hai jo sona nahi chahta.',
 'Jasmine Night — Nazuk, Meetha, Chandni Raat ki Tarah.',
 1099, 1499, 55,
 'womens', FALSE, FALSE, FALSE, TRUE, TRUE,
 ARRAY['Jasmine', 'Lemon', 'Bergamot'],
 ARRAY['Jasmine', 'Tuberose', 'Ylang-Ylang'],
 ARRAY['Sandalwood', 'Musk', 'Vanilla'],
 '8-10 ghante', 'Moderate', 'Floral Oriental', 100, 4.7, 112,
 ARRAY['jasmine', 'floral', 'womens', 'night'])

ON CONFLICT (slug) DO NOTHING;

-- ─── ADMIN SETUP ───────────────────────────────────────────
-- STEP 1: First register on the website with kashoperfume@gmail.com
-- STEP 2: Then run this query to make yourself admin:

UPDATE public.users
SET is_admin = TRUE
WHERE email = 'kashoperfume@gmail.com';

-- If the above shows 0 rows updated, your account needs to be created first.
-- Register on the website, then run this UPDATE again.

-- ─── VERIFY SETUP ──────────────────────────────────────────
SELECT 'Products created:' as info, COUNT(*) as count FROM public.products
UNION ALL
SELECT 'Categories created:', COUNT(*) FROM public.categories
UNION ALL
SELECT 'Admin users:', COUNT(*) FROM public.users WHERE is_admin = TRUE;
