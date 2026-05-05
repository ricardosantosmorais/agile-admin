# Legacy parity run status

Run: legacy-parity-2026-03-24
Legacy repo: C:/Projetos/admin
V2 repo: C:/Projetos/admin-v2-web
Base date: 2026-03-24

## Current state

- Inventory generated from legacy git history.
- First batch checked: `gateways-pagamento`.
- Gateways 3DS behavior was already present in v2; missing bridge coverage was added.
- Next step: open `importar-planilha/processos-arquivos` and compare the legacy `integra_planilha` filter with the v2 mapping flow.

## Completed batches

- `gateways-pagamento`: no functional migration needed; added Cielo 3DS bridge tests.

## Known local noise excluded

- .playwright-mcp/
- whatsapp-light-after.png
