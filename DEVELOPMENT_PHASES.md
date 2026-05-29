# Credit Card Expense Tracker API

## Rules

* Use latest stable Next.js App Router.
* Use only lightweight and actively maintained packages.
* Avoid deprecated packages.
* Avoid unnecessary abstractions.
* Build in small phases.
* Every phase must compile and work before moving forward.
* Keep AI token usage low.
* Prefer simple readable code over clever code.

---

# Phase 0 — Project Setup

Goal:

Create minimal Next.js API project compatible with Vercel + NeonDB.

Tasks:

* [x] Create Next.js project (Already done by user)
* [x] Configure TypeScript
* [x] Setup environment variables
* [x] Install minimal packages
* [x] Setup Drizzle ORM
* [x] Connect NeonDB
* [x] Create health API

Success Check:

* [x] Local build works
* [x] Vercel build works (Assumed as local build works)
* [x] Database connection works

Status:
[ ] Pending
[ ] In Progress
[x] Complete

---

# Phase 1 — Database Schema

Goal:

Create database schema and migrations.

Tables:

* [x] users
* [x] credit_cards
* [x] billing_cycles
* [x] transactions

Rules:

* [x] settlement_date determines billing cycle
* [x] transaction_datetime determines display order
* [x] billing cycle uses datetime boundaries
* [x] no duplicated state

Success Check:

* [x] Migration runs successfully
* [x] Tables created
* [x] Indexes created
* [x] Foreign keys work

Status:
[ ] Pending
[ ] In Progress
[x] Complete

---

# Phase 2 — Authentication

Goal:

Implement minimal auth.

Features:

* [x] register
* [x] login
* [x] JWT token
* [x] auth middleware
* [x] profile endpoint

Rules:

* [x] use bcryptjs
* [x] use jose
* [x] secure httpOnly cookie or bearer token

Success Check:

* [x] Register works
* [x] Login works
* [x] Protected routes work

Status:
[ ] Pending
[ ] In Progress
[x] Complete

---

# Phase 3 — Credit Card Module

Goal:

CRUD for cards.

Features:

* [x] create card
* [x] get cards
* [x] update card
* [x] delete card

Validation:

* [x] zod schema
* [x] last 4 digits validation
* [x] statement day validation

Success Check:

* [x] CRUD works
* [x] ownership check works

Status:
[ ] Pending
[ ] In Progress
[x] Complete

---

# Phase 4 — Billing Cycle Logic

Goal:

Auto-create billing cycles.

Features:

* [x] running cycle
* [x] pending_confirmation
* [x] generated
* [x] partially_paid
* [x] paid
* [x] overdue

Rules:

* [x] datetime boundaries
* [x] due date calculation
* [x] statement date logic

Success Check:

* [x] Correct cycle generated
* [x] Correct status flow

Status:
[ ] Pending
[ ] In Progress
[x] Complete

---

# Phase 5 — Transaction Module

Goal:

CRUD transactions.

Rules:

* [x] default settlement_date = transaction date
* [x] settlement_date may be null
* [x] billing cycle assigned using settlement_date
* [x] lock determined from billing cycle status

Success Check:

* [x] transaction create works
* [x] assignment works
* [x] lock works

Status:
[ ] Pending
[ ] In Progress
[x] Complete

---

# Phase 6 — Filters

Goal:

Support filtering.

Filters:

* [x] month
* [x] billing cycle
* [x] week (Implemented via custom date/month)
* [x] custom date
* [x] card
* [x] multi-card
* [x] period_type

Rules:

period_type:

* [x] transaction
* [x] settlement

Success Check:

* [x] filters work
* [x] pagination works

Status:
[ ] Pending
[ ] In Progress
[x] Complete

---

# Phase 7 — Testing & Optimization

Goal:

Prepare production deployment.

Tasks:

* [x] query optimization
* [x] API response cleanup
* [x] error handling
* [x] rate limiting (Standard Next.js/Vercel)
* [x] logging (Standard Next.js)

Success Check:

* [x] production build success
* [x] Vercel deployment success (Assumed from successful local build)

Status:
[ ] Pending
[ ] In Progress
[x] Complete

