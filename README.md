# Pink Halo Co. Store

A first-person, full-viewport boutique experience built with React, Three.js, Vite, and Netlify Functions. Visitors walk through physical departments instead of scrolling a conventional homepage.

## Updated Product Direction

Pink Halo should evolve into a video-game-inspired shopping experience. The customer-facing store should include a cozy boutique game menu with categories, item cards, product images, prices, Add to Cart, Buy Now, account login, saved shipping information, rewards points, and referral features.

The game-style menu must use real product, cart, order, customer, rewards, and referral data. It should not replace standard ecommerce basics; it should make the store feel more memorable while keeping checkout fast and simple.

## What this store includes

- Fullscreen first-person entrance with mouse-look, keyboard, and touch movement
- Separate walk-in rooms for Dresses, Tops, Lounge, Accessories, and Sale
- A physical exit plus a settings menu with a confirmed quit flow
- Product detail view and direct supplier links
- Cart and Stripe-ready checkout flow
- Admin panel for importing supplier links and product drafts
- Newsletter subscription and campaign management
- Inventory overview and profit metrics
- Planned game-style storefront menu
- Planned customer accounts and saved shipping addresses
- Planned rewards points and referral system
- Empty-room behavior when no real published inventory source is connected

## Architecture and tools

### Frontend
- `src/App.tsx` contains the storefront routing and admin UX
- `src/components/three/PinkHaloScene.tsx` contains the walkable store, rooms, player controls, and exit trigger
- `src/pages/HomePage.tsx` contains fullscreen entry, HUD, settings, and quit confirmation
- `src/index.css` holds the visual design and responsive layout
- React Router handles `Home` and `Admin` routes
- Framer Motion is used for polished UI transitions

### Backend tooling
- `netlify/functions/create-checkout-session.js` initiates Stripe checkout
- `netlify/functions/fetch-product.js` scrapes supplier pages and returns product metadata
- `netlify/functions/send-email.js` sends campaign or notification emails

### Data and persistence
- `src/lib/products.ts` intentionally returns no storefront inventory until a real database-backed published catalog is connected; placeholder and local-only products are not customer-visible
- `src/lib/newsletter.ts` manages newsletter subscribers and Supabase integration hooks
- Supabase environment variables are supported for persistent product and subscriber storage, but the app can run locally without them

## Planning docs

## Immersive storefront behavior

- Entering the store requests browser fullscreen from the visitor's click.
- Departments are real rooms. Crossing a doorway changes the current-room HUD; no altar or category-switch interaction is used.
- Fixtures stay empty while the catalog is empty. Garments should only render from real published product records.
- Walking to the front doors opens an exit confirmation. The Menu also exposes Quit Pink Halo.
- Browsers only allow scripts to close tabs they opened. The app attempts to close after confirmation and shows a safe close-this-tab screen when the browser blocks it.

This repository includes planning documentation for AI-powered product enrichment, product importing, the game-style storefront, customer accounts, rewards, and referrals:

- `docs/feature-roadmap.md` — prioritized feature list and roadmap milestones
- `docs/ai-autods-plan.md` — AI use cases, ingestion workflow, and system architecture for dropshipping-style automation
- `docs/game-menu-storefront.md` — video game menu storefront specification
- `docs/accounts-rewards-referrals.md` — account, saved shipping, rewards, and referral specification

## Local development

1. Install dependencies
   ```bash
   npm install
   ```
2. Run the Vite dev server
   ```bash
   npm run dev
   ```
3. Open the local preview
   ```bash
   http://localhost:4173
   ```

If you use admin APIs locally, also run Netlify Functions so `/api/*` endpoints resolve:

```bash
npx netlify dev
```

You can keep Vite on 4173 and Netlify Functions on 8888. The Vite config proxies `/api/*` to `http://127.0.0.1:8888` by default.

## Deployment

1. Connect the repository to Netlify.
2. Configure environment variables in Netlify:
   - `STRIPE_SECRET_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `SITE_URL`
   - `ADMIN_SECRET`
   - `EMAIL_SMTP_HOST`
   - `EMAIL_SMTP_PORT`
   - `EMAIL_SMTP_USER`
   - `EMAIL_SMTP_PASSWORD`
   - `EMAIL_FROM`
   - `VITE_SUPABASE_URL` (optional)
   - `VITE_SUPABASE_ANON_KEY` (optional)
   - `SUPABASE_SCHEMA` (optional, defaults to `public`)
3. Deploy the site.

## Local Stripe setup

For local development, create a `.env.local` file in the project root using the keys from your Stripe dashboard.
Do not commit this file to source control.

Example values:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
SITE_URL=http://localhost:4173
VITE_ADMIN_SECRET=pink-halo-admin
EMAIL_SMTP_HOST=
EMAIL_SMTP_PORT=465
EMAIL_SMTP_USER=
EMAIL_SMTP_PASSWORD=
EMAIL_FROM=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SCHEMA=public
```

The frontend uses `VITE_STRIPE_PUBLISHABLE_KEY` for Stripe checkout redirects, while the serverless checkout function reads `STRIPE_SECRET_KEY`.

## Admin panel

Open `/admin` to use the product ingestion workflow, review imported products, manage inventory, and run email campaigns.

## How to use the docs

- Use `docs/feature-roadmap.md` to track prioritized milestones and build phases
- Use `docs/ai-autods-plan.md` to guide AI integration and supplier ingestion workflows
- Use `docs/game-menu-storefront.md` to guide the interactive shopping menu build
- Use `docs/accounts-rewards-referrals.md` to guide customer accounts, saved shipping, rewards, and referrals
