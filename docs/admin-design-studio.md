# Admin Design Studio & Mockup System

## Purpose
Pink Halo needs internal admin tools for designing products, creating mockups, approving designs, and publishing sellable items to the storefront.

The design studio should work like an internal Canva-style product creation system connected to the database, product catalog, collections, inventory, manufacturers, and analytics.

## Core Workflow

```text
Idea
→ Design Draft
→ Mockup
→ Internal Approval
→ Manufacturer Template
→ Sample / Production
→ Product Listing
→ Launch
→ Sales Tracking
→ Restock or Retire
```

## Admin Features

- AI-assisted design generation
- Canva-style drag-and-drop editor
- Layer editor
- Text tools
- Typography presets
- Brand color palette
- Pattern library
- Logo and asset library
- Background remover
- Smart resizing
- Mockup generator
- Version history
- Approval queue
- Product publishing controls
- Design performance analytics

## Mockup Types

- T-shirts
- Hoodies
- Sweatshirts
- Crop tops
- Lounge sets
- Tote bags
- Phone cases
- Mugs
- Packaging
- Social media ads
- Lifestyle scenes

## Database Entities

- designs
- design_versions
- design_layers
- design_assets
- mockups
- mockup_templates
- product_design_links
- approvals
- collections
- launch_dates
- performance_metrics

## Approval Rules

Nothing should go live until approved.

Each design must have:

- Name
- Collection
- Version number
- Creator/admin
- Status
- Mockup files
- Manufacturer-ready export
- Product link
- Approval timestamp

## Status Flow

```text
draft
→ ready_for_review
→ approved
→ sent_to_manufacturer
→ sample_ordered
→ production_ready
→ published
→ archived
```

## Accuracy Rule

Design analytics must come from real product, order, and customer-event records. Do not show fake sales, views, conversion rates, or mock dashboard values.
