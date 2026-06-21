# Pink Halo Admin Dashboard

## Purpose
The admin dashboard must show real operational numbers from the database. It should help Pink Halo manage products, designs, manufacturers, inventory, orders, shipping, customers, marketing, and analytics.

## Dashboard Sections

### Overview

- Revenue
- Net revenue
- Orders
- Units sold
- Conversion rate
- Average order value
- Refunds
- Open issues

### Orders

- New orders
- Paid orders
- Fulfillment status
- Shipment status
- Delivery status
- Returns
- Refunds

### Products

- Active products
- Draft products
- Low stock
- Best sellers
- Slow sellers
- Product margins
- Return rate by product

### Design Studio

- Draft designs
- Designs awaiting approval
- Approved designs
- Mockups
- Product links
- Design performance

### Manufacturers

- Approved manufacturers
- Open purchase orders
- Production runs
- Sample status
- QC results
- Average lead time
- Defect rate

### Inventory

- Current stock
- Reserved stock
- Incoming stock
- Reorder alerts
- Inventory movements
- Warehouse status

### Shipping

- Open shipments
- Tracking numbers
- Delayed shipments
- Delivered orders
- Carrier performance
- Average delivery time

### Customers

- New customers
- Returning customers
- Customer lifetime value
- Reviews
- Support tickets
- Rewards activity

### Marketing

- Campaigns
- Email subscribers
- Coupons
- Affiliates
- Creator codes
- Campaign revenue

## Data Accuracy Rule

Every metric must be generated from database records. Admins should be able to click a number and see the source records behind it.

## Dashboard Warning Rules

Flag:

- Low stock
- High return rate
- Delayed shipments
- Negative margin products
- Failed payments
- Manufacturer delays
- Products with missing photos
- Products with no cost data
- Orders without tracking

## Admin Roles

- Owner
- Admin
- Designer
- Operations
- Customer Support
- Marketing
- Viewer

Each role should have permission limits.
