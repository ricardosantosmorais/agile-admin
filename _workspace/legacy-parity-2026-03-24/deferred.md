# Deferred and dependency-tracked legacy points

This file tracks legacy commits that were analyzed but intentionally not migrated because the current v2 has no equivalent surface, route or product contract yet. These items are not considered forgotten; they need a future product/module decision before implementation.

| Batch | Legacy commits | Point | Current decision | Reopen when |
|---|---|---|---|---|
| `navegacao-menu` | `957d6d086`, `a6eaa894b`, `f8b50c13e`, `7123ca80c`, `3380f0aa0`, `4ed10479e`, `fb3f73505` | Billing upgrade and financial-pending banners/modals in the legacy header/login. | Deferred. The legacy flow depends on `boot.php`, `includes/header.php`, `index.php`, `controllers/billing-upgrade-controller.php`, Redis/cache and financial/billing contracts that do not exist as a v2 shell surface today. | A v2 billing/financial-pending shell feature is defined, including API contract, visibility rules, copy, dismiss/open behavior and tenant/cache strategy. |
| `navegacao-menu` | `90360a405` | Hardcoded menu order for Loja de Apps and Cashback. | Deferred. The v2 menu cannot reorder modules/routes that do not exist in the current v2 navigation surface. | Loja de Apps and/or Cashback modules are created or formally mapped into v2 navigation. |
| `agente-ia` | `565592a44`, `2eac8a1ff`, `4e4da53ab` | Native Agent IA chat/sidebar scheduled execution UX, history timezone parsing and dark-mode contrast. | Deferred. The current v2 only embeds the external `Assistente de vendas IA`; it does not have the legacy Agent IA sidebar/chat DOM, controllers or schedule panel surface. | A native Agent IA chat module is created in v2, or the external assistant exposes a supported contract for schedules, history navigation and theme integration. |
