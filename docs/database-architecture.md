# Pink Halo Database Architecture

## Purpose
The database is the single source of truth for Pink Halo.

The admin dashboard, customer storefront, design studio, manufacturer system, inventory system, shipping system, analytics, rewards, and reports should all read from real database records.

## Core Data Rule

No production dashboard should show fake, estimated, or disconnected numbers. Every number must be traceable to database tables.

## Main Domains

### Customers

- customers
- customer_addresses
- customer_preferences
- wishlists
- wishlist_items
- customer_events

### Products

- products
- product_variants
- SKUs
- collections
- product_collection_links
- product_images
- product_tags
- size_guides

### Design Studio

- designs
- design_versions
- design_layers
- design_assets
- mockups
- mockup_templates
- design_approvals
- product_design_links

### Manufacturers & Suppliers

- manufacturers
- suppliers
- manufacturer_contacts
- samples
- manufacturer_scorecards
- supplier_documents

### Purchasing & Production

- purchase_orders
- purchase_order_items
- production_runs
- quality_control_checks
- production_status_history

### Inventory

- warehouses
- inventory
- inventory_movements
- stock_reservations
- reorder_rules

### Orders

- orders
- order_items
- order_status_history
- payments
- discounts
- coupons
- refunds

### Shipping

- shipments
- shipment_items
- tracking_numbers
- carriers
- shipping_events
- delivery_status_history

### Returns

- returns
- return_items
- return_reasons
- return_status_history
- restock_decisions

### Marketing

- campaigns
- campaign_assets
- email_flows
- affiliates
- affiliate_codes
- referrals

### Loyalty

- rewards_accounts
- rewards_transactions
- reward_rules
- vip_memberships

### Analytics

Analytics should be generated from source tables, not manually entered numbers.

Examples:

- Revenue from orders and payments
- Units sold from order_items
- Inventory from inventory and inventory_movements
- Return rate from returns and order_items
- Manufacturer performance from production_runs, QC checks, and shipments
- Design performance from product_design_links, product views, add-to-carts, and orders

## Status History Requirement

Important entities should have status history tables so the business can audit what happened over time.

Track status history for:

- Orders
- Shipments
- Returns
- Purchase orders
- Production runs
- Design approvals

## Accuracy Principle

Every admin metric should answer: where did this number come from?
