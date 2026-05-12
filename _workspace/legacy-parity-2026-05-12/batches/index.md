# Legacy parity 2026-05-12 batches

Range: `99f6b7ee9..2d57cb13c`

## Batches

| Order | Batch | Legacy commits | Why this grouping |
|---:|---|---:|---|
| 1 | [catalogos-digitais](./catalogos-digitais.md) | 30+ | New product surface and most commits in the delta. |
| 2 | [agile-store-ajustes](./agile-store-ajustes.md) | 7+ | Continuation of the Agile Store/SAC material and feedback work. |
| 3 | [pedidos-logistica](./pedidos-logistica.md) | 4+ | Operational order/logistics changes with backend contract risk. |
| 4 | [formularios-arquivos](./formularios-arquivos.md) | 3+ | File preview and form submission display parity. |
| 5 | [configuracoes-admin](./configuracoes-admin.md) | 5+ | Shared admin/config/editor/service fixes; should be split carefully. |
| 6 | [infraestrutura-aws](./infraestrutura-aws.md) | 10+ | New operational dashboard surface; likely needs product decision. |
| 7 | [shell-docs-operacao](./shell-docs-operacao.md) | mixed | Shell/session/docs/deploy changes that may be non-applicable or already covered. |

## Notes

- Merge commits were kept in the source range but should not drive migration by themselves.
- Asset-only commits should be checked for visible v2 impact, not copied blindly.
- Legacy-only infrastructure (`boot.php`, `.ebextensions`) remains subject to applicability checks.

