# Pink Halo Co. Feature Roadmap

## Objective
Build a modern ecommerce storefront with a streamlined admin workflow and AI-powered product ingestion, then expand toward a dropshipping-style catalog management platform.

## Phase 1 — Launch MVP (High Priority)

### 1. Core immersive storefront experience

- Full-viewport first-person store instead of a traditional scrolling homepage
- Physical department rooms for Dresses, Tops, Lounge, Accessories, and Sale
- Fullscreen entry, keyboard/mouse controls, touch controls, settings, and a physical exit
- Empty fixtures until real published inventory exists
- Modern home page with hero section and strong CTAs
- Category browsing tiles for Men, Women, Children, and Pets
- Product listing grid with clear pricing, stock labels, and add-to-cart actions
- Search + filter controls for product discovery
- Trust and promotion section with shipping, deals, and checkout reassurance
- Compact in-world HUD and persistent bag access

### 2. Shopping flow
- Cart summary UI with subtotal and profit metrics
- Stripe-compatible checkout flow via Netlify Function
- Customer view of cart and add/remove controls

### 3. Basic admin workflow
- Admin dashboard at `/admin`
- Link upload form for supplier product pages
- Scraping flow for title, description, price, and images
- Manual review and publishing of imported products
- Inventory overview and simple stock editing
- Subscriber management and email campaign controls

### 4. Developer essentials
- Responsive React + Vite storefront
- Netlify Functions for checkout, scraping, and email
- Supabase-ready integration stubs for newsletter and subscriber persistence
- Documentation for local development and deployment

## Phase 2 — AI acceleration (Medium Priority)

### 1. Product ingestion automation
- AI-generated product titles, descriptions, and bullet points
- Category/tag suggestion based on scraped content
- Image selection and caption generation

### 2. Price and merchandising intelligence
- Suggested retail markup from supplier cost
- Recommended discount or sale pricing
- Low stock heatmap and margin optimization hints

### 3. Search and customer discovery
- Natural-language search queries
- Suggested search terms and related products
- Personalized product ordering based on behavior

### 4. Marketing automation
- AI-powered email campaign subject lines and messaging
- Homepage promo copy generation
- Promotional banner suggestions based on product data

## Phase 3 — AutoDS-style dropshipping system (Lower Priority)

### 1. Bulk product import
- Paste several supplier links at once
- Queue multiple imports and scrape in batch
- Import status, success, and failure reporting

### 2. Supplier sync and automation
- Automatic supplier price sync when available
- Stock and availability sync with supplier feed
- Variant detection for sizes, colors, and options

### 3. Catalog management
- Publish/unpublish product drafts
- Auto-generate profit margin labels
- Free shipping eligibility and bestseller flags

### 4. Admin experience
- Recent imports dashboard
- Draft review workflow
- Supplier mapping and fulfillment notes

## Phase 4 — Operational maturity (Future)

### 1. Orders and analytics
- Order history dashboard
- Revenue and margin reporting
- Best-selling products and category insights

### 2. Customer support and personalization
- Chat assistant for visitor questions
- Recommended upsells and related items
- Email segmentation and subscriber automation

### 3. Expansion and scaling
- Internationalization and multiple currencies
- Multi-channel selling (social, marketplaces)
- Customer accounts and saved preferences
