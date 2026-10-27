# Worklog

---
Task ID: 1
Agent: main (Z.ai)
Task: Build bilingual (Persian/English) PWA for inventory & selling management from CSV format `#,name,price,amount,amount sold`, mobile responsive

Work Log:
- Initialized fullstack env (Next.js 16 + Prisma/SQLite + shadcn/ui)
- Prisma schema: Product (name, price, amount, amountSold) + Sale (transaction log); pushed to SQLite
- API routes: /api/products (GET/POST), /api/products/[id] (PATCH/DELETE), /api/sales (GET/POST, transactional with stock check), /api/import (robust CSV parser: auto-delimiter, quoted fields, header mapping incl. Persian headers/digits ۰-۹ + ٫ decimal, replace/merge modes), /api/export (BOM CSV, same schema round-trip), /api/stats (aggregates + low stock)
- i18n: src/lib/i18n.ts dictionaries (en/fa), LanguageProvider with localStorage persistence, dir=ltr/rtl switching on <html>, Intl number/date formatting with Persian digits in fa mode
- UI: stats cards (products/stock value/units sold/revenue + low stock warning), search, filter tabs (all/low/out), mobile card list + desktop table, sell dialog (qty stepper + quick chips), restock dialog, add/edit dialog, delete confirm, sales history dialog, import dialog (paste or file), mobile FAB, sticky footer, emerald theme + dark mode ready, Vazirmatn font for Persian
- PWA: src/app/manifest.ts (standalone, 4 icons incl. maskable), public/sw.js (shell cache + API network-first with offline cache fallback), icons generated via sharp script (scripts/generate-icons.js), install button via beforeinstallprompt, offline banner, apple-touch-icon, safe-area insets
- Fixed bugs found during verification: CSV header matcher treating "amount sold" as amount column; Persian decimal separator ٫ not parsed; formatMoney rounding decimals (2.5→3); lint set-state-in-effect issues (dialogs now keyed + conditionally mounted)
- Verified with agent-browser: mobile EN/FA (RTL mirrored, Persian digits), desktop table, add product, sell 5 units (stock 120→115, revenue 12.5), sales history, data menu, manifest+SW registered, no console errors; lint clean; test data cleaned

Stage Summary:
- App complete at / (single-route Next.js app), DB reset to empty state ready for user's real CSV import
- Key decisions: TanStack Query for data state, conditional-mount+key dialog pattern, network-first SW caching for offline read of last data
