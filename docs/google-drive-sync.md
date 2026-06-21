# Google Drive ↔ GitHub Sync Plan

## Purpose
Pink Halo uses two connected systems:

- Google Drive is the business operating system.
- GitHub is the technical operating system.

Both must stay aligned.

## Source of Truth Rules

### Google Drive owns:

- Brand direction
- Business strategy
- SOPs
- Marketing planning
- Product planning
- Customer experience
- Legal/policy drafts
- Roadmaps
- Human-readable operating docs

### GitHub owns:

- Code
- Technical docs
- Database architecture
- API specifications
- Admin dashboard requirements
- Schema plans
- Issue tracking
- Developer implementation notes
- Deployment notes

## Current Sync Map

| Business Area | Google Drive Folder | GitHub Path |
|---|---|---|
| Operating Index | 00 START HERE | docs/README.md |
| Admin Design Studio | 03 Website & Technology / 08 AI | docs/admin-design-studio.md |
| Supply Chain | 02 Products & Inventory / 04 Operations | docs/supply-chain-system.md |
| Database Architecture | 03 Website & Technology | docs/database-architecture.md |
| Product Pipeline | 02 Products & Inventory | docs/product-pipeline.md |
| Admin Dashboard | 03 Website & Technology / 06 Analytics | docs/admin-dashboard.md |
| Shipping | 04 Operations | docs/shipping-system.md |
| Inventory | 02 Products & Inventory | docs/inventory-system.md |
| Analytics | 06 Sales, Finance & Analytics | docs/analytics.md |

## Update Process

When a Google Drive doc changes:

1. Decide whether the change affects code, database, admin tools, API logic, or technical architecture.
2. If yes, update the matching GitHub markdown document.
3. If implementation is needed, create a GitHub issue.
4. Link the GitHub issue back in the Drive planning document when possible.

When GitHub changes:

1. If the change affects business process, update the matching Google Drive document.
2. If the change creates a new workflow, add it to SOPs.
3. If the change creates a customer-facing feature, update website and customer experience docs.

## Sync Frequency

- During active build: sync after every major planning change.
- During launch preparation: sync daily.
- After launch: sync weekly or after major changes.

## Accuracy Rule

GitHub should never contain a technical plan that conflicts with Google Drive. Google Drive should never describe a business process that the GitHub database and admin tools cannot support.
