# Bold Kings Global

Full-stack electronics store for the Nigerian market: storefront, cart and checkout, customer accounts, Paystack payments and an admin dashboard.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 7 · Zod 4

## Getting started

Requirements: Node.js 20.9+ and PostgreSQL 14+ (or Docker).

```bash
npm install                       # also generates the Prisma client
cp .env.example .env              # then fill in SESSION_SECRET (see below)
docker compose up -d              # local PostgreSQL matching .env.example
npm run db:deploy                 # apply migrations
npm run db:seed                   # categories + SAMPLE products (development only)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-passw0rd' ADMIN_NAME='Your Name' npm run admin:create
npm run dev                       # http://localhost:3000 · admin at /admin
```

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `SESSION_SECRET` | yes | ≥ 32 chars. Signs sessions and guest order links. Changing it invalidates existing guest order links. |
| `APP_URL` | yes in production | Public base URL, used for payment callbacks, the sitemap and canonical links |
| `PAYSTACK_SECRET_KEY` | no | Enables online payment. Leave empty to disable it. |
| `DATABASE_POOL_MAX` | no | Caps pooled DB connections per instance (small plans and serverless hosts) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | only for `admin:create` | Remove after provisioning |

The configuration is validated at startup, and a misconfiguration fails with a readable message.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Develop, build and serve |
| `npm run typecheck` / `lint` / `test` | Type checking, ESLint, and Vitest unit tests |
| `npm run db:migrate` | Create a new migration after editing `prisma/schema.prisma` |
| `npm run db:deploy` | Apply migrations (use this in production) |
| `npm run db:seed` | Seed categories and sample products. Refuses to run with `NODE_ENV=production`. |
| `npm run admin:create` | Create an admin, promote a user to admin, or reset an admin's password. Also signs out their sessions. |

## How it works

```
src/
  app/(store)/      storefront pages (home, shop, category, product, cart, checkout, account, content)
  app/admin/        admin login + dashboard (orders, products, categories, enquiries, settings)
  app/api/          JSON API; every response is { ok, data } or { ok:false, error }
  components/       store/, admin/ and shared UI
  server/           server-only: db, env, auth, payments, services (business logic)
  lib/              shared pure helpers (money, phone, order rules)
  schemas/          Zod schemas used by both forms and API routes
prisma/             schema, migrations, seed
scripts/            CLI scripts (admin provisioning)
```

**Key decisions**

- **Money:** amounts are stored as `NUMERIC(14,2)` naira and handled in code as integer kobo (`src/lib/money.ts`). Floats are never used for money.
- **Prices come from the server:** an order request carries only variant IDs and quantities. Totals are recomputed from the database inside the order transaction, and any extra fields in the request are dropped.
- **Stock:** stock is reserved with a conditional `UPDATE … WHERE stock >= qty` when an order is placed, so two shoppers can't buy the last unit. It is returned exactly once on cancellation. A database `CHECK (stock >= 0)` backs this up, and every stock change is logged in `InventoryMovement`.
- **Idempotent checkout:** the browser sends an idempotency key, so double submits and retries return the original order instead of creating a duplicate.
- **Payments:** Paystack payments are marked paid only after server-to-server verification, with the amount and currency checked. Webhooks are signature-checked and deduplicated. Staff can mark only offline payments as paid; online payments cannot be marked paid by hand.
- **Order lifecycle:** Pending → Confirmed → Processing → Shipped → Delivered. Cancellation is allowed until shipping. Every change is written to the audit log.
- **Access to orders:** guests view an order through a link carrying an HMAC token (the token is never stored). Signed-in customers see their own orders, and admins see all orders.
- **Security:** sessions are stored in the database and identified by an httpOnly cookie. Passwords are hashed with scrypt. State-changing requests are checked against the site's origin (CSRF). Login, registration, orders and contact are rate-limited, with the limits stored in PostgreSQL so they hold across instances. Uploads are checked by both file type and actual file content, and SVG is refused.
- **Cart:** the cart lives in localStorage for guests. For signed-in customers it is merged with their saved account cart and synced to it, so it follows them across devices.

## Going live: checklist

- [ ] **Replace the sample catalogue.** Seeded products, prices and stock are placeholders. Don't run `db:seed` in production. Add real products in `/admin/products`.
- [ ] **Review store settings** in `/admin/settings`: phones, WhatsApp, delivery fee and notes, payment options, and bank details. The seed turns on pay-on-delivery for development only.
- [ ] **Review the draft content pages** (`about`, `delivery-returns`, `privacy` under `src/app/(store)/`). The returns policy and privacy notice need the business's own terms, and a check against the Nigeria Data Protection Act 2023.
- [ ] **Paystack:** set `PAYSTACK_SECRET_KEY` (test key first). In the Paystack dashboard, set the webhook URL to `https://<your-domain>/api/payments/paystack/webhook`.
- [ ] **Product images** are stored on local disk in `./storage/uploads`. Use a host with a persistent disk, or switch `src/server/uploads.ts` to object storage (S3, Cloudinary and similar) on serverless platforms.
- [ ] Set `APP_URL` to the public HTTPS URL, and run `npm run db:deploy` on each deploy.
- [ ] Logo: `src/components/store/logo.tsx` currently renders a text wordmark.
- [ ] Email notifications (order confirmations to customers and staff) are **not implemented yet**. Customers get a confirmation page link, and staff see new orders and enquiries in the dashboard.

## Health check

`GET /api/health` returns `200 {"ok":true,"database":"up"}` when the app can reach the database.
