# 49 - Módulo Integrações > Clientes e Marketing

## Escopo Atual

- `Integrações > Clientes` mantém as abas CNPJá, CFO e Portal do Cliente.
- A aba CFO grava `cro_apikey` como parâmetro criptografado do tenant e reaproveita o padrão de edição protegida usado em CNPJá.
- A instrução da aba CFO preserva a regra do legado: os formulários de cadastro precisam dos campos obrigatórios `numero_cro` e `uf_cro`.
- `Integrações > Marketing > RD Station E-Commerce` usa tokens visuais do v2 para preservar contraste em tema claro e escuro.

## Cobertura

- Unitário:
  - `src/features/integracoes-clientes/services/integracao-clientes-mappers.test.ts`
- E2E:
  - `e2e/151-integracoes-clientes.spec.ts`
