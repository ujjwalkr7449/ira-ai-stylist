# E-Commerce Backend Gap Analysis & Completion Blueprint

## 1) Existing Features (Correct, Partially Correct, Incorrect)

### Authentication & User
- ✅ Implemented: user registration, login, JWT token issuance, and `/me` endpoint.
- ⚠️ Partial: no password reset flow (token generation, verification, update endpoint, expiry).
- ⚠️ Partial: user profile can be read (`/me`) but cannot be updated via dedicated API.
- ❌ Missing: address book model and APIs (multiple shipping/billing addresses with default flags).

### Catalog
- ✅ Implemented: categories CRUD (admin-protected for writes).
- ✅ Implemented: products CRUD with admin protection for writes.
- ⚠️ Partial: search exists but only by product name; no filter by price range, tag, rating, stock status, sorting, pagination.
- ⚠️ Partial: product details include static `rating` and `reviews` counters, but no real review entities and no user-generated ratings.

### Wishlist
- ✅ Implemented: persistent wishlist add/remove/toggle/list for authenticated users.
- ⚠️ Partial: no DB-level uniqueness constraint on `(user_id, product_id)` to prevent duplicates under race conditions.

### Orders / Checkout
- ✅ Implemented: order creation with line items; user order listing; admin order listing; admin status update.
- ⚠️ Partial: checkout currently trusts client-provided total/price and does not recalculate server-side.
- ❌ Missing: stock reservation/decrement and out-of-stock checks during order creation.
- ❌ Missing: coupon application and pricing breakdown (subtotal, discount, shipping, tax).
- ❌ Missing: idempotency keys for order-placement endpoint.
- ❌ Missing: cart persistence (server-side cart + cart items).

### Payment
- ❌ Missing: payment intent/session model, verification callbacks, retry flow, failure states, refund tracking.
- ❌ Missing: payment-order consistency checks (exact amount verification, anti-duplicate payment guards).

### Order Lifecycle
- ⚠️ Partial: supports simple statuses (`pending/confirmed/shipped/delivered/cancelled`).
- ❌ Missing: return requests, return approvals/rejections, partial returns, refund lifecycle.
- ❌ Missing: audit trail/event history per order.

### Admin & Ops
- ✅ Implemented: basic admin stats (counts/revenue sum).
- ⚠️ Partial: no user management endpoints (list users, block/unblock).
- ❌ Missing: inventory alerting (low stock threshold and alerts).
- ❌ Missing: payment tracking dashboard and refund management endpoints.
- ❌ Missing: coupon management APIs.
- ❌ Missing: granular analytics/reports (sales by day/category/product, AOV, conversion-like backend metrics).

### Security / Reliability / Performance
- ✅ Implemented: role-based guard (`require_admin`) and JWT auth.
- ⚠️ Partial: weak default secret in config; no key rotation strategy.
- ❌ Missing: structured API envelope + standardized error codes.
- ❌ Missing: request validation beyond schema basics (e.g., quantity > 0, price >= 0 consistently, status transitions).
- ❌ Missing: rate limiting for auth/payment endpoints.
- ❌ Missing: logging correlation IDs and monitoring hooks.
- ❌ Missing: caching strategy (products, category lists, cart snapshot).
- ❌ Missing: transactional locking strategy to handle concurrent checkout.

---

## 2) Missing Features Checklist (Production-Critical)

1. Password reset (request + token + confirm).
2. Profile update and address management APIs.
3. Persistent cart (CRUD cart items).
4. Server-side checkout pricing engine.
5. Coupon subsystem (creation, eligibility, usage limit, anti-abuse).
6. Payment subsystem (intent, verify, webhook, retry, failure handling).
7. Inventory-safe checkout with transaction boundaries.
8. Idempotency for order and payment APIs.
9. Returns/refunds (full + partial) and admin workflows.
10. Notifications (email/SMS/push/webhook) for lifecycle updates.
11. User management (admin block/unblock).
12. Sales analytics/report endpoints.
13. Security hardening (rate limit, secret management, audit logs).
14. Observability stack (structured logs, metrics, traces).

---

## 3) Improved Architecture Suggestions

## Service boundaries (modular monolith first)
- `auth` module: signup/login/refresh/password reset, token blacklist if needed.
- `catalog` module: categories, products, search index abstraction.
- `cart` module: user cart and pricing pre-check.
- `checkout` module: quote, coupon apply, place order (idempotent).
- `payments` module: provider abstraction (`create_intent`, `verify`, `refund`).
- `orders` module: lifecycle transitions with a finite-state-machine validator.
- `returns` module: request/approve/reject/receive/restock/refund.
- `admin` module: user moderation, inventory alerts, analytics.

## Data integrity
- Enforce DB constraints for uniqueness and non-negative numbers.
- Use DB transaction around order placement:
  1) lock inventory rows,
  2) validate stock,
  3) compute totals server-side,
  4) create order + items,
  5) decrement stock,
  6) create payment intent.

## API and security
- Versioned API namespace `/api/v1`.
- Standard response envelope:
  - success: `{ "ok": true, "data": ... }`
  - error: `{ "ok": false, "error": { "code": "...", "message": "..." } }`
- Add rate limiting middleware (e.g., Redis-backed) for auth, coupon, payment verify.
- Add idempotency middleware storing `(key, route, user_id, response_hash)`.

## Observability
- Structured JSON logging with request id.
- Metrics: checkout success rate, payment failure rate, low stock count, refund latency.
- Alerting thresholds for payment failures and stock anomalies.

## Performance
- Redis caching:
  - product list/search result keys,
  - category list,
  - cart snapshots.
- DB indexes on frequent filters (status, created_at, category_id, user_id, payment_status).

---

## 4) Required API Endpoints (Recommended Contract)

## Auth
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/confirm`

## User / Address
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users/me/addresses`
- `POST /api/v1/users/me/addresses`
- `PATCH /api/v1/users/me/addresses/{address_id}`
- `DELETE /api/v1/users/me/addresses/{address_id}`
- `POST /api/v1/users/me/addresses/{address_id}/default`

## Catalog
- `GET /api/v1/products?search=&category=&min_price=&max_price=&rating=&sort=&page=&limit=`
- `GET /api/v1/products/{id}`
- `GET /api/v1/categories`
- `GET /api/v1/products/{id}/reviews`
- `POST /api/v1/products/{id}/reviews`

## Cart / Wishlist
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/{item_id}`
- `DELETE /api/v1/cart/items/{item_id}`
- `GET /api/v1/wishlist`
- `POST /api/v1/wishlist`
- `DELETE /api/v1/wishlist/{product_id}`

## Checkout / Coupon
- `POST /api/v1/checkout/quote`
- `POST /api/v1/checkout/apply-coupon`
- `POST /api/v1/checkout/place-order` (requires `Idempotency-Key`)

## Payments
- `POST /api/v1/payments/intents`
- `POST /api/v1/payments/{payment_id}/verify`
- `POST /api/v1/payments/{payment_id}/retry`
- `POST /api/v1/payments/webhooks/provider`
- `POST /api/v1/payments/{payment_id}/refunds`

## Orders
- `GET /api/v1/orders`
- `GET /api/v1/orders/{id}`
- `POST /api/v1/orders/{id}/cancel`
- `POST /api/v1/orders/{id}/returns`
- `GET /api/v1/orders/{id}/events`

## Notifications
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/{id}/read`

## Admin
- `GET /api/v1/admin/users`
- `POST /api/v1/admin/users/{id}/block`
- `POST /api/v1/admin/users/{id}/unblock`
- `POST /api/v1/admin/products`
- `PATCH /api/v1/admin/products/{id}`
- `DELETE /api/v1/admin/products/{id}`
- `GET /api/v1/admin/inventory/low-stock`
- `PATCH /api/v1/admin/orders/{id}/status`
- `POST /api/v1/admin/returns/{id}/approve`
- `POST /api/v1/admin/returns/{id}/reject`
- `POST /api/v1/admin/coupons`
- `PATCH /api/v1/admin/coupons/{id}`
- `GET /api/v1/admin/payments`
- `GET /api/v1/admin/reports/sales`

---

## 5) Suggested Database Schema (Tables & Relations)

## Core identities
- `users(id, email UNIQUE, password_hash, name, phone, role, is_blocked, created_at, updated_at)`
- `addresses(id, user_id FK users, type, line1, line2, city, state, postal_code, country, is_default, created_at)`

## Catalog
- `categories(id, name UNIQUE, slug UNIQUE, image_url)`
- `products(id, category_id FK, name, description, price, original_price, stock, low_stock_threshold, is_active, created_at, updated_at)`
- `product_images(id, product_id FK, url, sort_order)`
- `product_variants(id, product_id FK, sku UNIQUE, size, color, price_delta, stock)`
- `reviews(id, product_id FK, user_id FK, rating, title, body, created_at)`

## Shopping
- `carts(id, user_id UNIQUE FK, created_at, updated_at)`
- `cart_items(id, cart_id FK, product_id FK, variant_id FK NULL, quantity, unit_price_snapshot)`
- `wishlists(id, user_id FK, product_id FK, created_at, UNIQUE(user_id, product_id))`

## Promotions
- `coupons(id, code UNIQUE, type(percent|fixed), value, min_order_amount, max_discount, usage_limit, per_user_limit, starts_at, ends_at, is_active)`
- `coupon_usages(id, coupon_id FK, user_id FK, order_id FK, used_at, UNIQUE(coupon_id, user_id, order_id))`

## Orders & payment
- `orders(id, user_id FK, status, payment_status, subtotal, discount_total, tax_total, shipping_total, grand_total, currency, address_id FK, placed_at, cancelled_at)`
- `order_items(id, order_id FK, product_id FK, variant_id FK NULL, name_snapshot, sku_snapshot, qty, unit_price, line_total)`
- `order_events(id, order_id FK, event_type, actor_id FK users NULL, metadata_json, created_at)`
- `payments(id, order_id FK, provider, provider_payment_id UNIQUE, amount, currency, status, attempt_no, idempotency_key UNIQUE, created_at)`
- `refunds(id, payment_id FK, amount, reason, status, created_at)`

## Returns
- `returns(id, order_id FK, user_id FK, status, reason, created_at)`
- `return_items(id, return_id FK, order_item_id FK, qty, resolution(refund|replace))`

## Platform support
- `idempotency_keys(id, user_id FK, route, key UNIQUE, request_hash, response_json, status_code, created_at)`
- `notifications(id, user_id FK, channel, type, title, body, is_read, created_at)`
- `inventory_movements(id, product_id FK, variant_id FK NULL, delta, reason, ref_type, ref_id, created_at)`

## Index recommendations
- `orders(user_id, created_at DESC)`
- `orders(status, payment_status, created_at DESC)`
- `products(category_id, is_active)`
- `payments(order_id, status)`
- `coupon_usages(coupon_id, user_id)`
- `notifications(user_id, is_read, created_at DESC)`

---

## 6) Real-World Edge Case Handling Strategy

- Duplicate order prevention: require `Idempotency-Key` header on place-order.
- Duplicate payment prevention: unique constraint on provider payment reference + idempotency key.
- Out-of-stock at checkout: lock and revalidate stock in transaction; fail atomically.
- Payment retry: increment attempt number and tie all attempts to one order.
- Coupon misuse prevention:
  - validate active window, global usage, per-user usage,
  - enforce minimum amount,
  - mark usage only on successful payment (or reserved with timeout).
- Partial refund/return:
  - refund against specific line items and quantities,
  - prevent refund amount > paid amount,
  - record cumulative refunded total.
- Concurrency/race safety:
  - transactional order creation,
  - DB constraints for uniqueness and non-negative stock,
  - optimistic/pessimistic locking as supported by DB.

---

## 7) Immediate Next Implementation Order

1. Introduce `/api/v1` and response envelope + error model.
2. Add address + cart + coupon data models and migrations.
3. Implement checkout quote and server-side pricing.
4. Add idempotent order placement with inventory-safe transaction.
5. Integrate payment provider abstraction and verification webhook.
6. Add return/refund module and admin workflows.
7. Add rate limiting + structured logs + metrics.
8. Add analytics/report endpoints and background notification jobs.
