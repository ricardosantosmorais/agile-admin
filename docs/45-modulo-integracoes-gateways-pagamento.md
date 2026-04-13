# 45 - Módulo Integrações > Gateways de Pagamento

## Objetivo

Migrar o módulo legado de Gateways de Pagamento para o v2, mantendo:

- listagem com filtros e ações;
- formulário com regras condicionais por tipo/gateway;
- normalização de payload no salvamento;
- integração com API-v3 via bridge em `app/api/*`.

## Rotas

- `/integracoes/gateways-pagamento`
- `/integracoes/gateways-pagamento/novo`
- `/integracoes/gateways-pagamento/[id]/editar`

## Bridge

Arquivo:

- `app/api/integracoes/gateways-pagamento/route.ts`

Operações:

- `GET`: listagem paginada e carregamento de registro por id;
- `POST` (`action=save`): criação/edição com normalizações de regra de negócio;
- `POST` (`action=delete`): exclusão em lote.

## Regras de negócio aplicadas

- seleção de `gateway` por tipo (`gateway_boleto_antecipado`, `gateway_cartao_credito`, `gateway_pix`);
- defaults e limpeza condicional de campos técnicos;
- regras de `3ds` e tokenização;
- normalização de numéricos (`dias_*`, `horas_*`, `minutos_validade`, `cep`, `cnpj`);
- fallback de ambiente para `producao`;
- `status_captura='recebido'` para Vindi.

## Estrutura v2

- página de listagem:
  - `src/features/gateways-pagamento/components/gateways-pagamento-list-page.tsx`
- página de formulário:
  - `src/features/gateways-pagamento/components/gateway-pagamento-form-page.tsx`
- client:
  - `src/features/gateways-pagamento/services/gateways-pagamento-client.ts`

## Teste E2E

- `e2e/integracoes-gateways-pagamento.spec.ts`
  - abertura da listagem;
  - navegação para formulário novo;
  - alternância de campos por tipo/gateway.
