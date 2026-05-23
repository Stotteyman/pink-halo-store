# Pink Halo Co. Store

A polished ecommerce storefront built with React, Vite, and Netlify Functions. This project is designed to support a customer-facing store and an admin-driven product ingestion workflow similar to dropshipping platforms like AutoDS.

## What this store includes

- Modern homepage with category discovery and strong CTAs
- Product grid for Men, Women, Children, and Pets
- Search and filter controls
- Product detail view and direct supplier links
- Cart and Stripe-ready checkout flow
- Admin panel for importing supplier links and product drafts
- Newsletter subscription and campaign management
- Inventory overview and profit metrics

## Architecture and tools

### Frontend
- `src/App.tsx` contains the main storefront and admin UX
- `src/index.css` holds the visual design and responsive layout
- React Router handles `Home` and `Admin` routes
- Framer Motion is used for polished UI transitions

### Backend tooling
- `netlify/functions/create-checkout-session.js` initiates Stripe checkout
- `netlify/functions/fetch-product.js` scrapes supplier pages and returns product metadata
- `netlify/functions/send-email.js` sends campaign or notification emails

### Data and persistence
- `src/lib/products.ts` stores catalog data in localStorage with sample fallback
- `src/lib/newsletter.ts` manages newsletter subscribers and Supabase integration hooks
- Supabase environment variables are supported for persistent subscriber storage, but the app can run locally without them

## AI and dropshipping planning

This repository now includes planning documentation for AI-powered product enrichment and an AutoDS-style import system:

- `docs/feature-roadmap.md` — prioritized feature list and roadmap milestones
- `docs/ai-autods-plan.md` — AI use cases, ingestion workflow, and system architecture for dropshipping-style automation

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
```

The frontend uses `VITE_STRIPE_PUBLISHABLE_KEY` for Stripe checkout redirects, while the serverless checkout function reads `STRIPE_SECRET_KEY`.

## Admin panel

Open `/admin` to use the product ingestion workflow, review imported products, manage inventory, and run email campaigns.

## How to use the docs

- Use `docs/feature-roadmap.md` to track prioritized milestones and build phases
- Use `docs/ai-autods-plan.md` to guide AI integration and supplier ingestion workflows
