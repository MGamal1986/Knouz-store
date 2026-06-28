# كنوز (Knouz) — Arabic E-Commerce Platform

A full-stack, production-ready Arabic e-commerce web application built for the Egyptian market. Right-to-left (RTL) UI, gold/burgundy/cream brand identity, Clerk authentication, and a complete admin dashboard.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [File Hierarchy](#file-hierarchy)
4. [Environment Variables](#environment-variables)
5. [Installation on Linux](#installation-on-linux)
6. [Installation on Windows](#installation-on-windows)
7. [Running in Development](#running-in-development)
8. [Building for Production](#building-for-production)
9. [Database Setup](#database-setup)
10. [API Reference Summary](#api-reference-summary)
11. [Admin Dashboard](#admin-dashboard)
12. [Storefront Pages](#storefront-pages)

---

## Project Overview

Knouz is a monorepo containing:

| Artifact | Description |
|----------|-------------|
| `artifacts/knouz` | React + Vite storefront & admin SPA |
| `artifacts/api-server` | Express.js REST API (port 8080) |
| `lib/db` | PostgreSQL schema via Drizzle ORM |
| `lib/api-spec` | OpenAPI 3.0 contract (source of truth) |
| `lib/api-client-react` | Auto-generated React Query hooks |
| `lib/api-zod` | Auto-generated Zod validation schemas |

A global reverse proxy routes `/api/*` to the API server and `/` to the React frontend.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 24 |
| Package manager | pnpm 10 (workspaces) |
| Language | TypeScript 5.9 (strict) |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui |
| Routing | Wouter |
| State/Data | TanStack Query v5 |
| Charts | Recharts |
| Authentication | Clerk (v6) |
| Backend | Express.js 5 |
| Database | PostgreSQL 16 + Drizzle ORM |
| Validation | Zod v4 |
| API codegen | Orval (from OpenAPI spec) |
| Build | esbuild (CJS bundle for API) |

---

## File Hierarchy

```
knouz/                                  ← monorepo root
│
├── pnpm-workspace.yaml                 ← workspace config, catalog pins
├── tsconfig.base.json                  ← shared TypeScript strict defaults
├── tsconfig.json                       ← root solution file (libs only)
├── package.json                        ← root-level dev tooling & scripts
│
├── artifacts/
│   │
│   ├── knouz/                          ← React + Vite frontend (SPA)
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── components.json             ← shadcn/ui config
│   │   ├── public/
│   │   │   ├── favicon.svg
│   │   │   ├── logo.svg
│   │   │   └── robots.txt
│   │   └── src/
│   │       ├── main.tsx                ← React entry point
│   │       ├── App.tsx                 ← Root router (storefront + admin split)
│   │       ├── index.css               ← Tailwind + Cairo font + brand tokens
│   │       │
│   │       ├── pages/                  ← Storefront pages
│   │       │   ├── home.tsx            ← Hero, featured products, categories
│   │       │   ├── shop.tsx            ← Product grid with search & filters
│   │       │   ├── product.tsx         ← Product detail + reviews + wishlist
│   │       │   ├── cart.tsx            ← Shopping cart
│   │       │   ├── checkout.tsx        ← Checkout form + coupon + order summary
│   │       │   ├── track.tsx           ← Order tracking by phone number
│   │       │   ├── account.tsx         ← User profile + order history
│   │       │   ├── admin.tsx           ← Admin sub-router (auth gate)
│   │       │   └── not-found.tsx
│   │       │
│   │       ├── admin/                  ← Admin dashboard pages
│   │       │   ├── AdminLayout.tsx     ← Dark sidebar + header shell (RTL)
│   │       │   ├── dashboard.tsx       ← Stats, charts, recent orders, low stock
│   │       │   ├── products.tsx        ← Full CRUD product management
│   │       │   ├── orders.tsx          ← Order management + status updates
│   │       │   ├── customers.tsx       ← Customer list + order history drill-down
│   │       │   ├── coupons.tsx         ← Coupon create/delete
│   │       │   ├── categories.tsx      ← Category CRUD with image
│   │       │   └── settings.tsx        ← Store settings (localStorage)
│   │       │
│   │       ├── components/
│   │       │   ├── Layout.tsx          ← Storefront header + footer
│   │       │   └── ui/                 ← shadcn/ui component library
│   │       │
│   │       ├── hooks/
│   │       │   ├── use-toast.ts
│   │       │   └── use-cart.ts         ← Zustand-backed cart hook
│   │       │
│   │       ├── stores/
│   │       │   └── cart.ts             ← Zustand cart store (localStorage)
│   │       │
│   │       └── lib/
│   │           └── utils.ts            ← cn() helper
│   │
│   └── api-server/                     ← Express.js API
│       ├── build.mjs                   ← esbuild production bundler
│       └── src/
│           ├── index.ts                ← HTTP server bootstrap
│           ├── app.ts                  ← Express app setup, middleware, routes
│           ├── lib/
│           │   └── logger.ts           ← Pino logger singleton
│           ├── middlewares/
│           │   └── auth.ts             ← Clerk JWT verification middleware
│           └── routes/
│               ├── index.ts            ← Route aggregator
│               ├── health.ts           ← GET /api/health
│               ├── products.ts         ← CRUD /api/products
│               ├── categories.ts       ← CRUD /api/categories
│               ├── orders.ts           ← POST/GET /api/orders
│               ├── coupons.ts          ← CRUD /api/coupons
│               ├── admin.ts            ← Admin-only routes /api/admin/*
│               ├── payment.ts          ← POST /api/payment (COD/card)
│               ├── upload.ts           ← POST /api/upload (Cloudinary)
│               └── wishlist.ts         ← GET/POST/DELETE /api/wishlist
│
├── lib/
│   ├── db/                             ← Database layer
│   │   ├── drizzle.config.ts           ← Migration config
│   │   └── src/
│   │       ├── index.ts                ← db client export
│   │       └── schema/
│   │           ├── index.ts            ← re-exports all tables
│   │           ├── products.ts         ← products table
│   │           ├── categories.ts       ← categories table
│   │           ├── orders.ts           ← orders + order_items tables
│   │           ├── coupons.ts          ← coupons table
│   │           └── reviews.ts          ← product reviews table
│   │
│   ├── api-spec/
│   │   ├── openapi.yaml                ← OpenAPI 3.0 contract (edit this first)
│   │   └── orval.config.ts             ← Codegen config → api-client-react + api-zod
│   │
│   ├── api-client-react/               ← AUTO-GENERATED (do not edit manually)
│   │   └── src/
│   │       ├── generated/
│   │       │   ├── api.ts              ← React Query hooks
│   │       │   └── api.schemas.ts      ← TypeScript types
│   │       ├── custom-fetch.ts         ← Fetch wrapper with auth headers
│   │       └── index.ts               ← Barrel export
│   │
│   └── api-zod/                        ← AUTO-GENERATED (do not edit manually)
│       └── src/
│           ├── generated/              ← Zod schemas per endpoint
│           └── index.ts               ← Barrel export
│
└── scripts/                            ← Shared utility scripts (if any)
```

---

## Environment Variables

Create a `.env` file at the **repo root** (and/or export these in your shell):

```env
# --- Required ---
DATABASE_URL=postgresql://user:password@localhost:5432/knouz

# --- Required for auth ---
# Get from https://dashboard.clerk.com → API Keys
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# --- Optional ---
SESSION_SECRET=your-random-secret-string

# --- Optional: Cloudinary image uploads ---
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Installation on Linux

### Prerequisites

```bash
# 1. Install Node.js 20+ (use nvm for easy version management)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 24
nvm use 24

# 2. Install pnpm
npm install -g pnpm

# 3. Install PostgreSQL 16
sudo apt update
sudo apt install -y postgresql-16 postgresql-client-16

# Start PostgreSQL service
sudo systemctl enable postgresql
sudo systemctl start postgresql

# 4. Create a database and user
sudo -u postgres psql <<EOF
CREATE USER knouz_user WITH PASSWORD 'your_password';
CREATE DATABASE knouz OWNER knouz_user;
GRANT ALL PRIVILEGES ON DATABASE knouz TO knouz_user;
EOF
```

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-org/knouz.git
cd knouz

# Install all workspace dependencies
pnpm install
```

### Configure Environment

```bash
# Copy and edit environment variables
cp .env.example .env
nano .env
# → Fill in DATABASE_URL, CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, VITE_CLERK_PUBLISHABLE_KEY
```

### Push Database Schema

```bash
# Push Drizzle schema to your PostgreSQL database
pnpm --filter @workspace/db run push
```

### Run Code Generation (optional — already committed)

```bash
# Only needed if you change openapi.yaml
pnpm --filter @workspace/api-spec run codegen
```

---

## Installation on Windows

### Prerequisites

**1. Install Node.js 24**

Download and run the installer from [nodejs.org](https://nodejs.org/en/download/).
Verify in PowerShell:
```powershell
node --version   # v24.x.x
npm --version
```

**2. Install pnpm**

```powershell
npm install -g pnpm
```

**3. Install PostgreSQL 16**

Download the installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/).

During setup:
- Set a password for the `postgres` superuser
- Leave the default port as `5432`

After installation, open **pgAdmin** or **psql** and create the database:

```sql
CREATE USER knouz_user WITH PASSWORD 'your_password';
CREATE DATABASE knouz OWNER knouz_user;
GRANT ALL PRIVILEGES ON DATABASE knouz TO knouz_user;
```

**4. (Recommended) Install Git for Windows**

Download from [git-scm.com](https://git-scm.com/download/win).

### Clone & Install

Open **PowerShell** or **Git Bash**:

```powershell
git clone https://github.com/your-org/knouz.git
cd knouz

pnpm install
```

### Configure Environment

Create a `.env` file in the root folder (or rename `.env.example`):

```powershell
copy .env.example .env
notepad .env
```

Fill in `DATABASE_URL` using your Windows PostgreSQL connection string:

```
DATABASE_URL=postgresql://knouz_user:your_password@localhost:5432/knouz
```

### Push Database Schema

```powershell
pnpm --filter @workspace/db run push
```

> **Windows tip:** If you see `EACCES` or path errors, run PowerShell as Administrator, or use [Windows Subsystem for Linux (WSL2)](https://learn.microsoft.com/en-us/windows/wsl/install) for a Linux-like environment.

---

## Running in Development

Two servers must run simultaneously:

### Terminal 1 — API Server (port 8080)

```bash
pnpm --filter @workspace/api-server run dev
```

### Terminal 2 — Frontend (Vite dev server)

```bash
pnpm --filter @workspace/knouz run dev
```

The frontend proxies `/api/*` requests to port 8080 automatically.

Open your browser at: `http://localhost:5173`  
Admin dashboard: `http://localhost:5173/admin`

---

## Building for Production

```bash
# 1. Typecheck everything
pnpm run typecheck

# 2. Build the API server (esbuild → dist/index.cjs)
pnpm --filter @workspace/api-server run build

# 3. Build the frontend (Vite → dist/)
pnpm --filter @workspace/knouz run build
```

### Serve in Production

**API Server:**
```bash
node artifacts/api-server/dist/index.cjs
```

**Frontend:**
Serve the `artifacts/knouz/dist/` folder with any static file server, e.g.:

```bash
# Using serve
npx serve artifacts/knouz/dist -p 3000

# Using nginx — point document root to artifacts/knouz/dist/
# and proxy /api to http://localhost:8080
```

**Nginx example config:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/knouz/artifacts/knouz/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Database Setup

The schema lives in `lib/db/src/schema/`. Tables:

| Table | Description |
|-------|-------------|
| `categories` | Product categories with slug + image |
| `products` | Products with price, stock, images[], featured flag |
| `orders` | Customer orders with shipping address JSON |
| `order_items` | Line items per order (product snapshot) |
| `coupons` | Discount coupons (% or fixed amount) |
| `reviews` | Product reviews with star rating |

### Useful Drizzle commands

```bash
# Push schema changes to the database (dev only)
pnpm --filter @workspace/db run push

# Generate SQL migration files (for production migrations)
pnpm --filter @workspace/db run generate
```

---

## API Reference Summary

All endpoints are prefixed with `/api`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products` | List products (search, category, sort, page) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category (admin) |
| PUT | `/api/categories/:id` | Update category (admin) |
| DELETE | `/api/categories/:id` | Delete category (admin) |
| POST | `/api/orders` | Place an order |
| GET | `/api/orders` | List orders (admin, paginated) |
| PUT | `/api/orders/:id` | Update order status (admin) |
| GET | `/api/orders/track` | Track by phone number |
| GET | `/api/coupons` | List coupons (admin) |
| POST | `/api/coupons` | Create coupon (admin) |
| DELETE | `/api/coupons/:id` | Delete coupon (admin) |
| POST | `/api/coupons/validate` | Validate a coupon code |
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/sales-chart` | Monthly revenue chart data |
| GET | `/api/admin/category-sales` | Revenue by category |
| GET | `/api/admin/customers` | Customer list with spend stats |
| GET | `/api/admin/customers/:userId/orders` | Orders by customer |
| GET | `/api/admin/orders/export` | Download CSV of orders |
| GET | `/api/wishlist` | Get user wishlist |
| POST | `/api/wishlist` | Add to wishlist |
| DELETE | `/api/wishlist/:productId` | Remove from wishlist |
| POST | `/api/upload` | Upload image to Cloudinary |

The full contract is in `lib/api-spec/openapi.yaml`.

---

## Admin Dashboard

Navigate to `/admin` (sign-in required).

| Page | Route | Capability |
|------|-------|-----------|
| لوحة التحكم | `/admin` | KPI cards, sales chart, category breakdown, recent orders, low-stock alerts |
| المنتجات | `/admin/products` | Search, filter, sort, add/edit/delete, toggle featured |
| الطلبات | `/admin/orders` | Filter by status, detail drawer, update status, export CSV |
| العملاء | `/admin/customers` | Search, expandable rows with order history |
| الكوبونات | `/admin/coupons` | Create (% or fixed), auto-generate code, delete, active/expired badge |
| الفئات | `/admin/categories` | Add/edit/delete with image preview |
| الإعدادات | `/admin/settings` | Store info, shipping rules, password change |

---

## Storefront Pages

| Page | Route | Description |
|------|-------|-------------|
| الرئيسية | `/` | Hero banner, featured products, category grid |
| المتجر | `/shop` | Full product catalog with search + category + sort filters |
| المنتج | `/product/:id` | Product images, details, add to cart, reviews, wishlist |
| السلة | `/cart` | Cart items, quantity controls, totals |
| الدفع | `/checkout` | Shipping form, coupon code, COD/card, order confirmation |
| تتبع الطلب | `/track` | Track any order by phone number |
| حسابي | `/account` | Order history (requires sign-in) |

---

## Key Development Commands

```bash
# Install dependencies
pnpm install

# Run full typecheck (libs + all packages)
pnpm run typecheck

# Push DB schema (dev)
pnpm --filter @workspace/db run push

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Build everything
pnpm run build
```
