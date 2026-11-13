# Architectural Decision Record (ADR) & System Architecture Plan
**Project:** NaysIn — Inventory Management & AI Menu Assistant for Nays Kopi  
**Document Version:** 1.0  
**Date:** 2026-11-13  
**Status:** Approved for Implementation (Respecting [CHARTER], [TURUNAN], [USULAN], [PERLU KONFIRMASI])

---

## 1. Context and Problem Statement
Nays Kopi currently logs raw inventory ingredients on paper and communicates stock status via WhatsApp groups. Manual stock checks occur every 2–3 hours. Menu names cause confusion for ~10% of customers, and ingredient waste occurs due to unmonitored expiration or slow movement. The objective is to digitalize internal inventory tracking and provide a grounded AI menu assistant without burdening staff, without replacing the existing physical ordering workflow, and without introducing POS/payment/ML purchasing.

---

## 2. Architectural Decisions & Rationales (ADRs)

### ADR-01: Deployment Target & Runtime — Netlify with Next.js Runtime
* **Decision:** Deploy on **Netlify** using Next.js App Router (TypeScript, Tailwind CSS) with automatic OpenNext-based Next.js Runtime.
* **Constraints Enforced:**
  * **No Static Export:** Never set `output: "export"` in `next.config`.
  * **No SPA Catch-All:** Do NOT add `/* /index.html 200` to redirects in `netlify.toml` as it hijacks SSR and API routes.
  * **Publish Directory:** Rely on default framework detection; do not override `publish` to `dist`, `out`, or `public`.
  * **Build Command:** `npm run build` with automatic Prisma client generation during build (`prisma generate && next build`).
  * **Runtime Choice:** Use standard Node.js serverless runtime for Route Handlers and Server Actions interacting with Prisma/SDKs; avoid Edge Runtime for Prisma routes.

### ADR-02: Database & Concurrency Strategy — External Managed PostgreSQL + Prisma ORM
* **Decision:** Use an external managed PostgreSQL instance (e.g. Neon or Supabase) with pooling (`DATABASE_URL`) for serverless execution and direct connection (`DIRECT_URL`) for Prisma migrations.
* **Data Integrity & Ledger:**
  * Double-entry immutable ledger table `StockTransaction` recording `beforeQty`, `afterQty`, `qty`, `type` (`IN`, `OUT`, `ADJUSTMENT`, `WASTE`), timestamp, and user audit.
  * Fast query aggregate maintained in `Ingredient.currentStock` updated **strictly inside the same atomic database transaction** (`prisma.$transaction`) with optimistic concurrency/serializable guarantees and row locking.
  * Strict constraint: **Zero negative inventory** (`currentStock >= 0`). Attempted reductions below zero fail immediately with HTTP 409 Conflict.
  * **Idempotency Keys:** Enforced on mutation endpoints via unique constraint in `StockTransaction.idempotencyKey` to prevent double-submissions from mobile network retries.

### ADR-03: Stateless Serverless Architecture
* **Decision:** Zero in-memory state or local filesystem dependencies.
* **Alert Calculations:** Low stock (`currentStock <= minimumStock`) and batch expiration (`expiresAt <= now() + thresholdDays`) computed deterministically at request-time.
* **Scheduled Tasks:** Optional background notifications rely on Netlify Scheduled Functions; core alerts operate at request-time.

### ADR-04: Grounded AI Menu Assistant Architecture
* **Decision:** Retrieval-augmented grounded answering.
* **Strict Guardrails:**
  * AI context only contains active, verified menu items and their officially verified aliases (`Menu`, `MenuAlias`).
  * Zero hallucination: If price, ingredients, allergens, or preparation details are absent from the database, the assistant explicitly states that information is not available and directs the user to consult staff.
  * Inactive items (`isAvailable: false`) are strictly excluded from recommendations.
  * Safe fallback on provider timeouts or errors. Server-side LLM calls only; no client-side exposure of API keys.

### ADR-05: Modular Official WhatsApp Adapter
* **Decision:** Server-side Route Handler (`/api/whatsapp/webhook`) implementing:
  * GET challenge verification (Meta Cloud API / official provider spec).
  * POST signature verification (HMAC-SHA256 using `WHATSAPP_APP_SECRET`).
  * Inbound event deduplication via `externalMessageId` in `ChatLog`.
  * If official credentials (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`) are unconfigured, return clean diagnostic status and maintain adapter in **PENDING** state with full mock coverage.

### ADR-06: Authentication & Role-Based Access Control (RBAC)
* **Decision:** Lightweight, secure JWT/Session cookie-based authentication (`jose` / `bcryptjs`) using `AUTH_SECRET`.
* **Roles:** `OWNER` (full access: user management, master data, audits, settings) and `STAFF` (operational: record stock movements, opname adjustments, waste logging, view inventory). Default deny on unauthorized role mutations.

---

## 3. Traceability to PRD v1.1 Tags
* `[CHARTER]`: Digital stock ledger, AI menu clarity, zero POS/checkout, Rp2.000.000 budget consciousness.
* `[TURUNAN]`: Next.js App Router, atomic stock ledger, request-time alerts, export CSV, audit logs.
* `[USULAN]`: Netlify OpenNext runtime, Neon/Supabase PostgreSQL, JWT HTTP-only cookie auth, Tailwind UI styling.
* `[PERLU KONFIRMASI]`: WhatsApp official provider onboarding, production PostgreSQL credentials, owner sign-off on live menu pricing/composition. Clear pending registers maintained.

