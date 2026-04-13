# 44 - Módulo Integrações > Financeiro

## Objetivo

O módulo **Integrações > Financeiro** gerencia as configurações de processamento de pagamentos e antifraude da empresa:

- **Gateways de Pagamento**: Configuração por filial para Boleto Bancário, Cartão de Crédito e PIX
- **Antifraude ClearSale**: Credenciais, ambiente e parâmetros de operação
- **Antifraude Konduto**: Credenciais e ambiente

Todos os parâmetros são armazenados em `empresas/parametros` na API-v3.

## Rota

```
/integracoes/financeiro
```

## Estrutura de Dados

### Gateways de Pagamento (por tipo)

| Campo                                    | Tipo       | Observação |
| ---------------------------------------- | ---------- | ---------- |
| `id_gateway_pagamento_boleto_antecipado` | ID Gateway | Por filial |
| `id_gateway_pagamento_cartao_credito`    | ID Gateway | Por filial |
| `id_gateway_pagamento_pix`               | ID Gateway | Por filial |

### ClearSale (Global)

| Campo                   | Tipo              | Observação                     |
| ----------------------- | ----------------- | ------------------------------ |
| `clearsale_ambiente`    | producao \| teste |                                |
| `clearsale_login`       | String            | Fornecido pela ClearSale       |
| `clearsale_senha`       | String            | **Criptografado** no BD        |
| `clearsale_fingerprint` | String            | Código da loja (seu_app)       |
| `clearsale_b2b_b2c`     | B2B \| B2C        | Tipo de contrato               |
| `clearsale_custom_sla`  | String (minutos)  | SLA customizado                |
| `clearsale_envia_pix`   | S \| N            | Envia pedidos PIX para análise |

### Konduto (Global)

| Campo                   | Tipo              | Observação              |
| ----------------------- | ----------------- | ----------------------- |
| `konduto_ambiente`      | producao \| teste |                         |
| `konduto_chave_publica` | String            | Fornecida pela Konduto  |
| `konduto_chave_privada` | String            | **Criptografado** no BD |

## Fluxo Operacional

### Carregamento (GET)

1. Bridge carrega em paralelo:
   - Parâmetros de integração financeira (14 chaves)
   - Lista de filiais
   - Lista de gateways de pagamento

2. Mappers normalizam os dados em estrutura interna

3. Componente renderiza 5 abas com os dados

### Salvamento (POST)

1. Usuário edita campos nas abas
2. Sistema detecta mudanças (`hasChanges`)
3. Botão "Salvar" é habilitado
4. Ao submeter, constrói payload com:
   - Versão (timestamp)
   - Parâmetros globais de ClearSale e Konduto
   - Senhas/chaves privadas com flag de encriptação
   - Gateways por filial
5. Envia ao backend via `POST /api/integracoes/financeiro`
6. Backend persiste em `empresas/parametros`
7. Recarrega dados para refrescar estado

## Campos Sensíveis

As senhas e chaves privadas recebem tratamento especial:

- **Carregamento**: Mascaradas no frontend (retornam vazias)
- **Edição**: Campo `disabled` se já existe valor
- **Alteração**: Botão "Alterar" habilita edição (limpa valor)
- **Salvamento**: Envia apenas se `includeClearSaleSenha` ou `includeKondutoChavePrivada` for true
- **Encriptação**: Flag `criptografado: 1` indica ao backend para criptografar

## Validações

- Ambiente: Select obrigatório (producao/teste)
- Login/Chave Pública: Texto livre
- Senha/Chave Privada: Só neste formulário (não incluso em bulk)
- Gateway: Select com lista carregada do endpoint `gateways_pagamento`
- Custom SLA: Texto (normalmente numérico, mas aceita qualquer valor)

## Permissões

- Leitura: Qualquer usuário autenticado
- Escrita: Bloqueada para `id_empresa = 1705083119553379` a menos que usuário tenha flag `master = true`
- Permissão específica: `checkPermissao('102')` (referência legada mantida em sync)

## Componentes Reutilizados

- `PageHeader`: Breadcrumb e título
- `SectionCard`: Container de conteúdo
- `AppDataTable`: Tabela de filiais x gateways

## Testes

### Unitários

- [integracao-financeiro-mappers.test.ts](../src/features/integracoes-financeiro/services/integracao-financeiro-mappers.test.ts)
  - Normalização de payload GET
  - Construção de payload POST
  - Encriptação de campos sensíveis

### E2E

- [integracoes-financeiro.spec.ts](../e2e/integracoes-financeiro.spec.ts)
  - Carregamento de página
  - Navegação entre abas
  - Detecção de mudanças
  - Validação visual de campos

## Bridge

```
GET  /api/integracoes/financeiro
POST /api/integracoes/financeiro
```

Implementado em [app/api/integracoes/financeiro/route.ts](../app/api/integracoes/financeiro/route.ts)

### GET - Carrega

1. `GET /empresas/parametros?q=chave in(...)` (14 chaves)
2. `GET /filiais` (lista com nome_fantasia)
3. `GET /gateways_pagamento` (lista com tipo)

### POST - Salva

- Array de parâmetros com validação
- Persiste em `POST /empresas/parametros` (API-v3)

## Mapeadores

- [integracao-financeiro-mappers.ts](../src/features/integracoes-financeiro/services/integracao-financeiro-mappers.ts)
  - `normalizeIntegracaoFinanceiroRecord()`: API → Interno
  - `buildIntegracaoFinanceiroSavePayload()`: Interno → API

## Cliente HTTP

- [integracao-financeiro-client.ts](../src/features/integracoes-financeiro/services/integracao-financeiro-client.ts)
  - `integracaoFinanceiroClient.get()`
  - `integracaoFinanceiroClient.save()`

## i18n

Chaves adicionadas:

- `integrationsFinancial.title`
- `integrationsFinancial.description`
- `integrationsFinancial.tabs.*`
- `integrationsFinancial.feedback.*`
- `integrationsFinancial.fields.*`
- `integrationsFinancial.helpers.*`

## Referências ao Legado

| Componente   | Legado                                 | v2                                        |
| ------------ | -------------------------------------- | ----------------------------------------- |
| Controller   | `integracao-financeiro-controller.php` | `app/api/integracoes/financeiro/route.ts` |
| View         | `integracao-financeiro-form.php`       | `integracao-financeiro-page.tsx`          |
| Operação     | Wizard com 5 abas                      | Tabs com conteúdo condicional             |
| Persistência | `empresas/parametros`                  | `empresas/parametros` (mesmo)             |

## Próximas Evoluções

- [ ] Testes com dados reais de tenant
- [ ] Integração com webhook de validação de credenciais
- [ ] Dashboard de status de integrações
- [ ] Histórico de mudanças (auditoria própria)
