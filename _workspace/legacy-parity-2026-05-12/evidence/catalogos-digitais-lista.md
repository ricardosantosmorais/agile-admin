# Catálogos Digitais - listagem v2

## Legado analisado

- `controllers/catalogos-studio-controller.php`
- `includes/catalogos-digitais-permissions.php`
- `scripts/sql/2026-05-04-catalogos-digitais-studio-permissoes.sql`

## Corte migrado

- Entrada dinâmica do menu legado `catalogos-studio` para `/catalogos-digitais`.
- Permissão v2 `catalogosDigitais` mapeando `CATALOGOS_DIGITAIS`.
- Bridge `app/api/catalogos-digitais` para listar `catalogos_digitais`.
- Consulta da Agile Store para o módulo `mod_catalogos_digitais`.
- Alerta v2 quando o módulo não estiver contratado.
- Listagem com busca, status, publicação, produtos, blocos, vigência e URL pública.

## Corte pendente

- Studio de criação/edição.
- Seções/blocos, upload de imagem e layout.
- Produtos, coleções e precificação.
- Preview HTML, PDF e publicação.

## Validação

- `.\npxw.cmd vitest run src/features/catalogos-digitais/services/catalogos-digitais-mappers.test.ts app/api/catalogos-digitais/route.test.ts src/features/catalogos-digitais/components/catalogos-digitais-list-page.test.tsx`
- `.\npmw.cmd run typecheck`
- `.\npmw.cmd run lint`
