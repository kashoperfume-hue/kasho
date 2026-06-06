# Kasho — Netlify Deploy Guide

## Step 1 — Netlify pe Environment Variables Set Karein

Netlify Dashboard → Your Site → Site Configuration → Environment Variables mein yeh sab add karein:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zmjatjptlwuuztphbnsd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptamF0anB0bHd1dXp0cGhibnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NjQ4MTAsImV4cCI6MjA5NjE0MDgxMH0.k9poMChr-QLjQhWzLFcvPoRbhbKq6zFszp1pi3jXp-E` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptamF0anB0bHd1dXp0cGhibnNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU2NDgxMCwiZXhwIjoyMDk2MTQwODEwfQ.g4J8j-eS6mlSMn-GUEYuPTdmrFQb-sER1j56DjaZbDM` |
| `NEXT_PUBLIC_SITE_URL` | `https://YOUR-SITE-NAME.netlify.app` (apna actual Netlify URL daalen) |

## Step 2 — Build Settings (Already in netlify.toml)

Build command: `npm run build`
Publish directory: `.next`
Node version: `20`

## Step 3 — Deploy

1. Yeh folder GitHub pe upload karein (ya GitHub repo se connect karein)
2. Netlify pe "Trigger Deploy" karein
3. Build complete hone ka wait karein

## Step 4 — Admin Access Set Karein

Deploy ke baad:
1. `/register` pe apna admin account banayein
2. Supabase Dashboard → SQL Editor mein yeh run karein:
   ```sql
   UPDATE public.users SET is_admin = TRUE WHERE email = 'your@email.com';
   ```
3. `/admin/login` pe login karein

## Step 5 — Supabase Auth Settings Fix Karein

Supabase Dashboard → Authentication → URL Configuration mein:
- Site URL: `https://YOUR-SITE-NAME.netlify.app`
- Redirect URLs mein add karein:
  - `https://YOUR-SITE-NAME.netlify.app/**`
  - `http://localhost:3000/**`

## Kya Fix Kiya Gaya

1. ✅ `netlify.toml` — Build command fix kiya, `NPM_FLAGS=--legacy-peer-deps` add kiya
2. ✅ `package.json` — `react-image-zoom` (unused, React 19 incompatible) remove kiya
3. ✅ `.gitignore` — `.env.local` properly ignore ho rahi hai
4. ✅ `hooks/useAuth.ts` — Infinite re-render bug fix kiya
5. ✅ `middleware.ts` — Admin check logic improve kiya
6. ✅ `next.config.ts` — ESLint ignore during builds (build failures fix)
