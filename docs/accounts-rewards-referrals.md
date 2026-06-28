# Accounts, Rewards, and Referrals

## Objective

Pink Halo customers should be able to create accounts, save shipping information, earn rewards points, and share referral links.

## Customer Account

The account dashboard should feel like a player profile inside the Pink Halo shopping experience.

Required features:

- Account creation
- Login
- Password reset
- Saved shipping addresses
- Default shipping address
- Order history
- Wishlist
- Rewards point balance
- Referral link
- Referral progress
- Available discounts

## Saved Shipping

Customers should be able to save more than one shipping address and choose one as the default. Checkout should allow a logged-in customer to select a saved address, edit it, or add a new one.

## Rewards

Customers should see rewards points in the account dashboard, product preview, cart, and checkout.

Point sources:

- Purchases
- Referrals
- Approved reviews
- Account creation
- Email signup
- Birthday reward
- VIP campaigns

## Referral Flow

Each account should have a unique referral link or code. The system should track the referrer, referred customer, order, reward amount, and reward status.

## Suggested Database Tables

- customer_profiles
- customer_addresses
- orders
- order_items
- carts
- wishlist_items
- rewards_accounts
- rewards_transactions
- referral_codes
- referral_events
- discount_redemptions

## Admin Needs

Admin should be able to review reward balances, referral activity, customer addresses for order support, and reward transaction history.

## Launch Priority

1. Account creation and login.
2. Saved shipping addresses.
3. Order history.
4. Wishlist.
5. Purchase-based points.
6. Referral links.
7. VIP levels and birthday rewards.
