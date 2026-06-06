# Supabase Setup Guide for Kasho

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose region: **ap-northeast-2** (Seoul) for India-focused performance
3. Note down:
   - Project URL: `https://<project-id>.supabase.co`
   - Anon/Public Key
   - Service Role Key (Settings → API)

---

## Step 2 — Run the Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Open and run the file: `supabase/migrations/001_initial.sql`
3. This creates all tables, RLS policies, indexes, and seed data

---

## Step 3 — Configure Storage Buckets

The migration SQL creates the required buckets automatically. Verify they exist in **Storage**:

| Bucket | Public | Purpose |
|---|---|---|
| `products` | ✅ Yes | Product images |
| `banners` | ✅ Yes | Homepage banners |
| `avatars` | ✅ Yes | User profile photos |
| `payment-proofs` | ❌ No | UPI payment screenshots |
| `reviews` | ✅ Yes | Review images |
| `qr-codes` | ✅ Yes | UPI QR codes |

If any are missing, create them manually:
1. Storage → New Bucket
2. Set public/private as above

---

## Step 4 — Configure Auth

1. Go to **Authentication → Settings**
2. Enable **Email OTP** under Email Provider:
   - OTP Expiry: 3600 seconds (1 hour)
   - Disable email confirmation (use OTP only)
3. Set **Site URL** to your production URL (or `http://localhost:3000` for dev)
4. Add redirect URLs:
   ```
   http://localhost:3000/**
   https://yourdomain.netlify.app/**
   ```

---

## Step 5 — Grant Admin Access

After your first login, run this in SQL Editor to make yourself admin:

```sql
UPDATE public.users 
SET is_admin = TRUE 
WHERE email = 'your@email.com';
```

---

## Step 6 — Seed Initial Data (Optional)

The migration includes default categories. To add sample products for testing:

```sql
INSERT INTO public.products (name, slug, sku, description, short_description, sale_price, original_price, stock_quantity, is_active, is_featured, is_new_arrival, collection_type, top_notes, heart_notes, base_notes, volume_ml)
VALUES 
  ('Noir Séduction', 'noir-seduction', 'KS-001', 'A deep, sensual blend of dark woods and spice...', 'Dark. Magnetic. Unforgettable.', 2499, 3499, 50, true, true, true, 'mens', ARRAY['Bergamot', 'Black Pepper'], ARRAY['Vetiver', 'Cedar', 'Tobacco'], ARRAY['Musk', 'Amber', 'Sandalwood'], 100),
  ('Rose Lumière', 'rose-lumiere', 'KS-002', 'A luminous floral fragrance that captures the essence of dawn...', 'Radiant. Feminine. Timeless.', 1999, 2799, 30, true, true, true, 'womens', ARRAY['Bergamot', 'Green Tea'], ARRAY['Rose', 'Jasmine', 'Lily'], ARRAY['White Musk', 'Sandalwood'], 100),
  ('Oud Mystique', 'oud-mystique', 'KS-003', 'An opulent journey through the ancient spice routes...', 'Ancient. Opulent. Mystical.', 3999, 4999, 20, true, true, false, 'unisex', ARRAY['Saffron', 'Cardamom'], ARRAY['Oud', 'Rose', 'Iris'], ARRAY['Amber', 'Patchouli', 'Musk'], 100);
```

---

## Step 7 — Initialize Settings

Run this to set up the default settings rows (already included in migration, but just in case):

```sql
INSERT INTO public.settings (key, value) VALUES
  ('upi', '{"upi_id": "", "qr_url": null, "instructions": "Please transfer the exact amount and upload the payment screenshot.", "is_active": true}'),
  ('shipping', '{"free_shipping_threshold": 999, "standard_shipping_charge": 99, "is_shiprocket_active": false}')
ON CONFLICT (key) DO NOTHING;
```

---

## Step 8 — RLS Summary

All tables use Row Level Security (RLS). Key policies:

| Table | Read | Write |
|---|---|---|
| `products` | Public (active only) | Admins only |
| `categories` | Public | Admins only |
| `orders` | Own orders | Authenticated users |
| `reviews` | Public (approved) | Authenticated users |
| `addresses` | Own addresses | Own addresses |
| `wishlist` | Own wishlist | Own wishlist |
| `users` | Own profile | Own profile |
| `banners` | Public | Admins only |
| `coupons` | Active only | Admins only |
| `settings` | Public (read) | Admins only |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://zmjatjptlwuuztphbnsd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
SESSION_SECRET=your_random_session_secret_32_chars_min
```

---

## Troubleshooting

**"relation does not exist"** — Run the migration SQL again in SQL Editor.

**Auth redirect not working** — Check Site URL and redirect URLs in Auth → Settings.

**Images not loading** — Verify storage bucket exists and is set to public.

**Admin login fails** — Make sure `is_admin = TRUE` is set for your user in the `users` table.

**RLS blocking queries** — Ensure you're passing the auth token correctly (handled by `@supabase/ssr`).
