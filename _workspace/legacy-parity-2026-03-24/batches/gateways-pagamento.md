# Batch: gateways-pagamento

Commits: 6
Date range: 2026-03-24..2026-05-04

| Date | Commit | Type | Disposition | Subject | Files |
|---|---|---|---|---|---:|
| 2026-03-24 | 65ac3403b | form-field-or-form-flow | compare-and-likely-migrate | feat(gateways-pagamento): adiciona campos 3DS da Cielo e regras condicionais | 4 |
| 2026-03-24 | 27de03d9f | form-field-or-form-flow | compare-and-likely-migrate | fix(gateways-pagamento): preserva campos 3DS ao alternar switch | 2 |
| 2026-04-08 | 0b3694fa6 | form-field-or-form-flow | compare-and-likely-migrate | Padroniza invalidacao de cache remoto no admin | 75 |
| 2026-05-04 | d9d4c2ebe | diagnostic | compare-and-likely-migrate | fix: adiciona diagnostico ao salvar gateway de pagamento | 1 |
| 2026-05-04 | ccebc4ccf | bugfix | compare-and-likely-migrate | fix: retorna debug seguro no erro do gateway | 1 |
| 2026-05-04 | 4bec384a4 | bugfix | compare-and-likely-migrate | fix: solicita json ao salvar gateway de pagamento | 1 |

## Detailed commits

### 65ac3403b - feat(gateways-pagamento): adiciona campos 3DS da Cielo e regras condicionais

- Date: 2026-03-24
- Type: form-field-or-form-flow
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/gateways-pagamento-form.js
  - M boot.php
  - M components/gateways-pagamento-form.php
  - M controllers/gateways-pagamento-controller.php

### 27de03d9f - fix(gateways-pagamento): preserva campos 3DS ao alternar switch

- Date: 2026-03-24
- Type: form-field-or-form-flow
- Disposition: compare-and-likely-migrate
- Files:
  - M assets/js/components/gateways-pagamento-form.js
  - M boot.php

### 0b3694fa6 - Padroniza invalidacao de cache remoto no admin

- Date: 2026-04-08
- Type: form-field-or-form-flow
- Disposition: compare-and-likely-migrate
- Files:
  - M controllers/api-controller.php
  - M controllers/api-erp-controller.php
  - M controllers/areas-pagina-controller.php
  - M controllers/arquivos-controller.php
  - M controllers/banco-dados-erp-controller.php
  - M controllers/banners-controller.php
  - M controllers/campanhas-compre-junto-controller.php
  - M controllers/campanhas-descontounidade-controller.php
  - M controllers/campanhas-levepague-controller.php
  - M controllers/canais-distribuicao-controller.php
  - M controllers/clientes-controller.php
  - M controllers/colecoes-controller.php
  - M controllers/componentes-campos-controller.php
  - M controllers/componentes-controller.php
  - M controllers/compre-ganhe-controller.php
  - M controllers/condicoes-pagamento-controller.php
  - M controllers/configuracoes-clientes-controller.php
  - M controllers/configuracoes-entregas-controller.php
  - M controllers/configuracoes-geral-controller.php
  - M controllers/configuracoes-ia-controller.php
  - M controllers/configuracoes-inicio-controller.php
  - M controllers/configuracoes-layout-controller.php
  - M controllers/configuracoes-pedidos-controller.php
  - M controllers/configuracoes-precos-controller.php
  - M controllers/configuracoes-produtos-controller.php
  - M controllers/configuracoes-vendedores-controller.php
  - M controllers/conversores-pagamento-controller.php
  - M controllers/cupons-desconto-controller.php
  - M controllers/departamentos-controller.php
  - M controllers/emails-templates-controller.php
  - M controllers/empresas-controller.php
  - M controllers/filiais-controller.php
  - M controllers/formas-entrega-controller.php
  - M controllers/formas-pagamento-controller.php
  - M controllers/formularios-campos-controller.php
  - M controllers/fornecedores-controller.php
  - M controllers/funcionalidades-controller.php
  - M controllers/gateways-pagamento-controller.php
  - M controllers/grades-controller.php
  - M controllers/grupos-controller.php
  - M controllers/grupos-promocao-controller.php
  - M controllers/imagens-erp-controller.php
  - M controllers/implantacoes-controller.php
  - M controllers/integracao-apps-controller.php
  - M controllers/integracao-atendimento-controller.php
  - M controllers/integracao-cliente-controller.php
  - M controllers/integracao-financeiro-controller.php
  - M controllers/integracao-login-controller.php
  - M controllers/integracao-logistica-controller.php
  - M controllers/integracao-marketing-controller.php
  - M controllers/integracao-notificacoes-controller.php
  - M controllers/integracao-promocoes-controller.php
  - M controllers/integracao-scripts-controller.php
  - M controllers/integracao-seguranca-controller.php
  - M controllers/listas-controller.php
  - M controllers/marcas-controller.php
  - M controllers/notificacoes-controller.php
  - M controllers/paginas-controller.php
  - M controllers/parametros-empresa-controller.php
  - M controllers/parametros-erp-controller.php
  - M controllers/perfis-controller.php
  - M controllers/portos-controller.php
  - M controllers/produtos-controller.php
  - M controllers/produtos-departamentos-controller.php
  - M controllers/promocoes-controller.php
  - M controllers/redes-controller.php
  - M controllers/segmentos-controller.php
  - M controllers/supervisores-controller.php
  - M controllers/transportadoras-controller.php
  - M controllers/usuarios-controller.php
  - M controllers/vendedores-controller.php
  - M docs/04-convencoes-iniciais.md
  - M docs/06-padroes-por-area.md
  - M docs/ai/skills/backend-controllers.skill.md
  - M docs/architecture/backend-controllers.md

### d9d4c2ebe - fix: adiciona diagnostico ao salvar gateway de pagamento

- Date: 2026-05-04
- Type: diagnostic
- Disposition: compare-and-likely-migrate
- Files:
  - M controllers/gateways-pagamento-controller.php

### ccebc4ccf - fix: retorna debug seguro no erro do gateway

- Date: 2026-05-04
- Type: bugfix
- Disposition: compare-and-likely-migrate
- Files:
  - M controllers/gateways-pagamento-controller.php

### 4bec384a4 - fix: solicita json ao salvar gateway de pagamento

- Date: 2026-05-04
- Type: bugfix
- Disposition: compare-and-likely-migrate
- Files:
  - M controllers/gateways-pagamento-controller.php
