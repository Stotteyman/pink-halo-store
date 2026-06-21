# Manufacturer, Fulfillment & Supply Chain Operating System

## Purpose
Pink Halo must track products from idea to customer delivery using real database records.

This system covers manufacturers, suppliers, samples, purchase orders, production, inventory, shipping, fulfillment, tracking, returns, refunds, and performance analytics.

## Manufacturer Selection Process

```text
Research
→ Shortlist
→ Contact
→ Sample Order
→ Quality Inspection
→ Pricing Review
→ Shipping Review
→ Communication Review
→ Approval
→ Production
```

## Manufacturer Scorecard

Each manufacturer should be scored on:

- Product quality
- Consistency
- MOQ
- Lead time
- Communication
- Return handling
- Packaging quality
- Shipping speed
- Reliability
- Defect rate
- Reorder performance

## Product Order Lifecycle

```text
Design approved
→ Manufacturer assigned
→ Purchase order created
→ Production begins
→ Quality control
→ Shipment created
→ Tracking number received
→ Inventory updated
→ Customer order fulfilled
→ Customer notified
→ Delivered
→ Review requested
```

## Database Entities

- manufacturers
- suppliers
- manufacturer_contacts
- samples
- products
- variants
- SKUs
- purchase_orders
- purchase_order_items
- production_runs
- quality_control_checks
- warehouses
- inventory
- inventory_movements
- customer_orders
- order_items
- shipments
- tracking_numbers
- returns
- refunds

## Tracking Rules

Every shipment must be linked to an order.
Every order must be linked to a customer.
Every SKU must be linked to inventory.
Every inventory movement must be recorded.
Every purchase order must link to a manufacturer or supplier.
Every return must link to the original order item.

## Admin Dashboard Requirements

The admin dashboard should show:

- Open orders
- Revenue
- Inventory levels
- Low stock alerts
- Returns
- Open shipments
- Delayed shipments
- Refunds
- Popular products
- Manufacturer performance
- Average delivery time
- Profit by SKU

## Data Accuracy Rule

All numbers must come from real database records and live order data. No manual placeholder numbers should be used in production dashboards.
