# Unresolved Questions & Assumptions Register
**Project:** NaysIn — Nays Kopi  
**Date:** 2026-11-13  
**Status:** Living Document for Project Manager (Tegar Eka Pambudi El Akhsan) & Nays Kopi Owner

| Code | Type | Item / Description | Current Working Assumption (Implemented) | Status / Action Needed |
| :--- | :--- | :--- | :--- | :--- |
| **UQ-01** | `[PERLU KONFIRMASI]` | **Official WhatsApp Provider & Credentials:** Charter mentions WhatsApp group usage and Rp100k SIM budget, but official Meta WhatsApp Business Cloud API / BSP provider account, phone number ID, and app secret are pending. | Implemented modular adapter with standard Cloud API webhook verification, HMAC-SHA256 signature checking, and message deduplication. Full mock test suite provided. Status labeled **PENDING INTEGRATION**. | Awaiting partner Meta Business Manager verification & phone number provisioning. |
| **UQ-02** | `[PERLU KONFIRMASI]` | **Managed PostgreSQL Provider & Connection:** External hosting selection between Neon, Supabase, or Railway. | Designed for connection pooling with `DATABASE_URL` (pooler) and `DIRECT_URL` (direct) for Prisma migrations. SQLite/PostgreSQL parity in schema tests. | Provide production connection strings in Netlify environment variables before go-live. |
| **UQ-03** | `[PERLU KONFIRMASI]` | **Live Menu & Pricing Verification:** Official menu prices and exact ingredient recipes have not been fully audited/signed off by Nays Kopi owner. | Seeded initial DEMO data clearly labeled with prefix `[DEMO]`. AI Assistant strictly configured with zero-hallucination guardrail: if price or recipe is null, assistant directs customer to barista. | Owner to sign off on final production menu list and aliases. |
| **UQ-04** | `[PERLU KONFIRMASI]` | **Expiry Threshold Configuration:** Days threshold before batch is flagged as expiring soon. | Default set to 3 days (configurable via `Setting` key `EXPIRY_THRESHOLD_DAYS`). | Confirm standard shelf-life policies for fresh milk, syrup, and coffee beans with Nays Kopi staff. |
| **UQ-05** | `[USULAN]` | **Stock Units & Conversions:** Whether stock is tracked purely in base units (e.g. `gram`, `ml`, `pcs`) or requires dynamic packaging conversions. | Enforced base units on creation (`gram`, `ml`, `pcs`, `sachet`). Conversions discouraged without verified conversion table to prevent drift. | Confirm staff preference during UAT. |
| **UQ-06** | `[USULAN]` | **Netlify Plan & Execution Limits:** Serverless function timeout on Netlify Starter is 10s. | Route handlers optimized for fast sub-second execution. AI chat streams or returns under 3s with concise prompt limits. | Monitor function execution times on Netlify dashboard. |

