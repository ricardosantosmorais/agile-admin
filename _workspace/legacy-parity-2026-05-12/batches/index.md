# Legacy parity 2026-05-12 batches

Range: `99f6b7ee9..2d57cb13c`

## Batches

| Order | Batch | Legacy commits | Status | Why this grouping / next action |
|---:|---|---:|---|---|
| 1 | [catalogos-digitais](./catalogos-digitais.md) | 30+ | Partial | New product surface and most commits in the delta. Block image upload, products/collections, draft HTML preview and pricing recalculation are migrated; complete PDF/publication and final functional/visual validation. |
| 2 | [agile-store-ajustes](./agile-store-ajustes.md) | 7+ | Done | Continuation of the Agile Store/SAC material and feedback work. |
| 3 | [pedidos-logistica](./pedidos-logistica.md) | 4+ | Done | Operational order/logistics changes with backend contract risk. |
| 4 | [formularios-arquivos](./formularios-arquivos.md) | 3+ | Done | File preview and form submission display parity. |
| 5 | [configuracoes-admin](./configuracoes-admin.md) | 5+ | Done | Shared admin/config/editor/service fixes; split by owner during implementation. |
| 6 | [infraestrutura-aws](./infraestrutura-aws.md) | 10+ | Partial / backend dependency | V2 routes and dashboards prepared, but live AWS collection depends on server-side endpoints in `api-v3`. |
| 7 | [shell-docs-operacao](./shell-docs-operacao.md) | mixed | Done | Shell/session/docs/deploy changes checked for applicability. |
| 8 | [status-plataforma](./status-plataforma.md) | 15+ | Done | Refreshed legacy delta for the topbar platform-status micro indicator. |
| 9 | [relatorios-data-hora](./relatorios-data-hora.md) | 1 | Done | Latest report-process parity for `data_hora` dynamic filters. |
| 10 | [pedidos-brinde-aprovacao](./pedidos-brinde-aprovacao.md) | 1 | Done | Manual order approval now cascades to pending gift orders in the same transaction. |
| 11 | [vendedores-valida-horario](./vendedores-valida-horario.md) | 1 | Done | Seller records now preserve the legacy schedule-validation flag. |

## Notes

- Merge commits were kept in the source range but should not drive migration by themselves.
- Asset-only commits should be checked for visible v2 impact, not copied blindly.
- Legacy-only infrastructure (`boot.php`, `.ebextensions`) remains subject to applicability checks.
- A screen is only done when every legacy button, action, text, field, filter, modal, permission, payload and validation has been implemented or explicitly recorded as pending/not applicable.
- Use [../HANDOFF.md](../HANDOFF.md) as the entrypoint for new chats and branch cleanup decisions.
