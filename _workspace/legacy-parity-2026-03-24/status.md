# Legacy parity run status

Run: legacy-parity-2026-03-24
Legacy repo: C:/Projetos/admin
V2 repo: C:/Projetos/admin-v2-web
Base date: 2026-03-24

## Current state

- Inventory generated from legacy git history.
- First batch checked: `gateways-pagamento`.
- Second batch checked: `importar-planilha/processos-arquivos`.
- Gateways 3DS behavior was already present in v2; missing bridge coverage was added.
- Spreadsheet import mapping needed the legacy field-level `integra_planilha` filter; v2 now filters dictionary fields in the mapper with regression coverage.
- Next step: open `notificacoes-painel` and compare channel/audience/status changes with the v2 flow.

## Completed batches

- `gateways-pagamento`: no functional migration needed; added Cielo 3DS bridge tests.
- `importar-planilha/processos-arquivos`: migrated `integra_planilha` field filtering in spreadsheet mapping and added mapper test coverage.

## Known local noise excluded

- .playwright-mcp/
- whatsapp-light-after.png
