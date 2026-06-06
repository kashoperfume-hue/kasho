# Kasho — Premium Perfume E-Commerce Platform

A full-featured luxury perfume store built with **Next.js 15**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, and **Supabase**.

---

## ✨ Features

- **Animated homepage** with intro loader, hero section, fragrance collections, bestsellers
- **Product catalogue** with filters, sorting, zoom gallery, fragrance notes (top/heart/base)
- **Multi-step checkout** — address auto-fill via pincode, COD + UPI payment with screenshot upload
- **Customer accounts** — orders, tracking timeline, wishlist, saved addresses, reviews
- **Admin dashboard** — products, orders, coupons, analytics, banner management, UPI/shipping settings
- **Supabase Auth** — email OTP login with secret admin trigger
- **India Pincode API** — auto city/state detection
- **Shiprocket integration** — shipping label + tracking sync

---

## 🚀 Deploy to Netlify

### Prerequisites
- Node.js 22+
- pnpm (optional, npm works too)
- Supabase project (see `SUPABASE_SETUP.md`)

### Steps

1. **Clone / unzip** the kasho project
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase and other credentials
   ```
4. **Run the Supabase schema** — See `SUPABASE_SETUP.md`
5. **Build and deploy**
   ```bash
   npm run build
   ```
   Or connect your repo to Netlify — it auto-detects the `netlify.toml`.

### Netlify Environment Variables

Set these in Netlify → Site Settings → Environment Variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_SITE_URL` | Your production Netlify URL |
| `SESSION_SECRET` | Random secret string (32+ chars) |
| `SHIPROCKET_EMAIL` | (Optional) Shiprocket account email |
| `SHIPROCKET_PASSWORD` | (Optional) Shiprocket password |

---

## 🛠 Local Development

```bash
npm install
cp .env.example .env.local
# edit .env.local with your Supabase credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗂 Project Structure

```
kasho/
├── app/
│   ├── (auth)/          # Login, register, verify pages
│   ├── (shop)/          # Customer-facing shop
│   │   ├── page.tsx     # Homepage
│   │   ├── products/    # Product listing + detail
│   │   ├── cart/        # Shopping cart
│   │   ├── checkout/    # Multi-step checkout
│   │   ├── account/     # Profile, orders, wishlist, addresses
│   │   ├── collections/ # Collection pages
│   │   └── search/      # Search results
│   ├── admin/           # Admin dashboard (protected)
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── coupons/
│   │   ├── customers/
│   │   ├── analytics/
│   │   ├── homepage/
│   │   └── settings/
│   └── api/             # API routes
├── components/
│   ├── home/            # Homepage sections
│   ├── layout/          # Navbar, Footer, CartDrawer
│   ├── product/         # ProductCard, etc.
│   ├── account/         # Account sidebar, order cards
│   └── admin/           # AdminLayout
├── hooks/               # useCart, useWishlist, useAuth
├── lib/                 # Supabase clients, utils, orders
├── types/               # TypeScript types
└── supabase/
    └── migrations/      # SQL schema
```

---

## 🔐 Admin Access

The admin panel is at `/admin/login`. Access is restricted to users with `is_admin = true` in Supabase.

**Secret trigger to reach admin login:**
- Click the **Kasho logo** 5 times quickly, OR
- Long-press the logo for 3 seconds

**Grant admin access in Supabase SQL Editor:**
```sql
UPDATE public.users SET is_admin = TRUE WHERE email = 'your@email.com';
```

---

## 💳 Payments

| Method | How it works |
|---|---|
| **Cash on Delivery** | Customer pays on delivery |
| **UPI** | Customer scans QR / sends to UPI ID, uploads screenshot, admin verifies manually |

Configure UPI in Admin → Settings → UPI Payment.

---

## 🎨 Brand Colors

| Token | Color |
|---|---|
| `cream` | `#F8F5F0` |
| `beige` | `#E8DED1` |
| `sage` | `#C8D5C0` |
| `rose` | `#D9B8B0` |
| `gold` | `#C8A46A` |
| `charcoal` | `#3A3630` |

---

## 📦 Tech Stack

- **Next.js 15** (App Router)
- **TypeScript 5.7**
- **Tailwind CSS 3**
- **Framer Motion 11**
- **Supabase** (Auth + PostgreSQL + Storage)
- **Zustand** (cart + wishlist state)
- **TanStack Query**
- **React Hot Toast**
- **Lucide React**
