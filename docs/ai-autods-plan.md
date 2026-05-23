# AI and AutoDS Dropshipping Plan

## Vision
Create a product ingestion system that feels like an AutoDS-style dropshipping platform: fast link import, AI enrichment, and live storefront publishing with low manual effort.

## AI use cases

### 1. Product ingestion & enrichment
- Auto-extract product title, description, price, images, and category from supplier URLs
- Generate SEO-friendly headlines and product summaries
- Produce benefits, features, and customer-facing copy
- Normalize attributes like size, color, material, and brand

### 2. Pricing and margin intelligence
- Suggest retail price from supplier cost plus margin rules
- Recommend discounts, sales, and promotional pricing
- Flag products with low or high margins
- Estimate profit and shipping thresholds

### 3. Search and discovery
- Intent-aware search across product descriptions and categories
- Query suggestions as the user types
- Related products and trending item recommendations
- Personalized sort order based on usage metrics

### 4. Marketing automation
- Generate campaign subject lines and email body copy
- Suggest homepage banners and promotional hooks
- Create branded newsletter copy from product metadata
- Support segmented email content by category or promotion

### 5. Customer assistance
- Automated help assistant for product selection questions
- FAQ generation from product copy and site content
- Style or gift recommendation engine

## AutoDS-style ingestion workflow

### Step 1: Link upload
- Admin enters one or more supplier product URLs
- System validates URLs and starts a scrape process

### Step 2: Scraping and parsing
- Backend fetches the supplier pages
- Extract structured metadata: title, price, description, image, variants
- Use AI to interpret ambiguous fields and generate missing content

### Step 3: Draft creation
- Store imported product data as a draft record
- Present a preview in admin dashboard
- Allow edit of name, description, price, category, stock, and images

### Step 4: Publish to storefront
- Admin approves and publishes the draft
- Product becomes available in the live catalog
- Optionally notify subscribers or launch a campaign

## System architecture

### Data model
- `products`
  - id, name, description, category, price, imageUrl, supplierLink, stock, status, profitMargin
- `suppliers`
  - id, name, domain, contact, syncRules
- `imports`
  - id, url, status, extractedData, errors, createdAt
- `inventory`
  - stock, lastSyncedAt, supplierAvailability
- `subscribers`
  - email, optedIn, createdAt
- `campaigns`
  - subject, body, recipients, sentAt

### Admin UI components
- Link import form
- Import status board with success/failure messages
- Product preview and edit form
- Publish/unpublish controls
- Subscriber manager and campaign editor

## Functional tools and architecture

### Backend services
- Netlify Functions for:
  - checkout session creation
  - supplier scraping and product extraction
  - email delivery
- Supabase or local persistence for:
  - subscriber storage
  - persisted product catalog
  - analytics data

### AI toolchain
- Use a text generation API to:
  - create product descriptions
  - infer categories and tags
  - generate email copy
  - improve search relevance

## Prioritized implementation

1. Build the core ingestion UI and scraper flow
2. Add AI enrichment for title, description, and category
3. Add bulk import and draft management
4. Add supplier sync, auto-price, and stock update rules
5. Add analytics, orders, and operational dashboards
