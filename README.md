# Pink Halo Co. Store

A responsive ecommerce storefront built with React, Vite, and Netlify Functions.

## Features

- Product categories for men, women, children, and pets
- Admin panel for uploading product links and auto-scraping title, description, price, and images
- Stripe checkout integration ready via Netlify Functions
- Inventory tracking and profit dashboard
- Supabase integration prepared with environment variable stubs
- SEO-friendly metadata and modern animations

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run locally:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:4173`

## Deployment to Netlify

1. Connect this repository to Netlify.
2. Configure environment variables in Netlify:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `SITE_URL`
   - `ADMIN_SECRET`
   - `EMAIL_SMTP_HOST` (for Zoho: `smtppro.zoho.com`)
   - `EMAIL_SMTP_PORT` (for Zoho: `465` or `587`)
   - `EMAIL_SMTP_USER`
   - `EMAIL_SMTP_PASSWORD`
   - `EMAIL_FROM` (for example: `Pink Halo Co. <newsletter@pinkhalo.co>`)
   - `VITE_SUPABASE_URL` (optional)
   - `VITE_SUPABASE_ANON_KEY` (optional)
3. Deploy.

## Admin panel

Open `/admin` from `localhost` to use the admin uploader and inventory dashboard.
