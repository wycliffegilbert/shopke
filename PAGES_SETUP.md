# ShopKE — Missing Pages Setup Guide

## New Files Created

### Admin Pages (all inside `frontend/src/app/admin/`)
```
admin/
  layout.tsx          ← Shared sidebar + topbar for ALL admin pages
  page.tsx            ← Dashboard (updated — no more duplicate sidebar)
  orders/page.tsx     ← Orders management with status update modal
  products/page.tsx   ← Products with UploadThing image uploader (4 tabs)
  categories/page.tsx ← Category cards with toggle active/inactive
  customers/page.tsx  ← Customer table with search + stats
  coupons/page.tsx    ← Coupon cards with usage bars + create modal
  analytics/page.tsx  ← Charts: revenue, orders, pie, top products table
  settings/page.tsx   ← Profile, password, store config, notifications
```

### Customer Pages
```
app/
  not-found.tsx                        ← 404 page
  loading.tsx                          ← Global loading skeleton
  auth/
    forgot-password/page.tsx           ← Request reset link
    reset-password/page.tsx            ← Set new password (with strength meter)
    verify-email/page.tsx              ← Email verification handler

# These go into your (store) route group:
(store)/
  wishlist/page.tsx                    ← Wishlist grid with add-to-cart
  account/page.tsx                     ← Profile, password, addresses tabs
  order-success/page.tsx               ← Post-checkout confirmation
```

### UploadThing Files
```
app/api/uploadthing/
  core.ts    ← File router (productImages, singleImage, bannerImage)
  route.ts   ← Next.js route handler (GET + POST)
lib/
  uploadthing.ts              ← Client helpers (UploadButton, UploadDropzone)
components/admin/
  ProductImageUploader.tsx    ← Full drag-drop uploader with preview
```

---

## Step 1 — Install UploadThing packages

```powershell
cd D:\saas\ecommerce\frontend
npm install uploadthing @uploadthing/react
```

## Step 2 — Get UploadThing credentials

1. Go to https://uploadthing.com and sign up (free)
2. Create a new app called "shopke"
3. Copy your **App ID** and **Secret Key**
4. Add to `frontend/.env.local`:

```env
UPLOADTHING_SECRET=sk_live_xxxxxxxxxxxx
UPLOADTHING_APP_ID=xxxxxxxxxxxx
```

## Step 3 — Add UploadThing styles to layout.tsx

In `frontend/src/app/layout.tsx`, add this import at the top:

```tsx
import "@uploadthing/react/styles.css";
```

## Step 4 — Move store pages into correct (store) route group

The pages saved in `store-pages/` need to go into your `(store)` route group folder:

```
src/app/(store)/wishlist/page.tsx          ← from store-pages/wishlist/
src/app/(store)/account/page.tsx           ← from store-pages/account/
src/app/(store)/order-success/page.tsx     ← from store-pages/order-success/
```

In PowerShell:
```powershell
cd D:\saas\ecommerce\frontend\src\app

# Create folders
mkdir "(store)\wishlist"
mkdir "(store)\account"  
mkdir "(store)\order-success"
```

Then copy/paste the file contents into those locations.

## Step 5 — Update next.config.mjs for UploadThing images

Add `utfs.io` to allowed image domains in `frontend/next.config.mjs`:

```js
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.shopke.co.ke' },
      { protocol: 'https', hostname: 'utfs.io' },           // ← add this
      { protocol: 'https', hostname: '**.ufs.sh' },          // ← add this
    ],
  },
};
```

## Step 6 — Restart dev server

```powershell
cd D:\saas\ecommerce\frontend
Remove-Item -Recurse -Force .next
npm run dev
```

---

## Admin Navigation Summary

All admin pages now share `admin/layout.tsx` which provides:
- ✅ Sidebar with active link highlighting
- ✅ Mobile hamburger menu
- ✅ Logout button
- ✅ "View Store" link
- ✅ Admin access guard (redirects non-admins)
- ✅ User avatar in top bar

## Product Image Uploader Features

The `ProductImageUploader` component supports:
- ✅ Drag & drop upload zone
- ✅ Click to browse files
- ✅ Up to 8 images per product
- ✅ Set primary image (shown in product cards)
- ✅ Remove individual images
- ✅ Alt text for each image (SEO)
- ✅ Upload progress indicator
- ✅ Image number badges
- ✅ Add more images button in grid

## Product Modal Tabs

1. **Basic Info** — Name, category, brand, description, SKU, flags
2. **Images** — UploadThing drag-drop uploader with preview grid
3. **Pricing & Stock** — Price, compare price, cost price, profit margin calculator, stock, low stock threshold
4. **SEO & Tags** — Tags, meta title/description, live Google preview
