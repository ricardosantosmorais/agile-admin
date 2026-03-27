# 28 - Módulos Financeiros de Pagamento

## Escopo desta rodada
- `Condições de pagamento`
- `Tabelas de preço`
- `Formas de pagamento`

## Referências usadas
- legado:
  - `C:\Projetos\admin\components\condicoes-pagamento-list.php`
  - `C:\Projetos\admin\components\condicoes-pagamento-form.php`
  - `C:\Projetos\admin\components\tabelas-preco-list.php`
  - `C:\Projetos\admin\components\tabelas-preco-form.php`
  - `C:\Projetos\admin\components\formas-pagamento-list.php`
  - `C:\Projetos\admin\components\formas-pagamento-form.php`
- api-v3:
  - `C:\Projetos\api-v3\app\Models\CondicaoPagamento.php`
  - `C:\Projetos\api-v3\app\Models\CondicaoPagamentoFilial.php`
  - `C:\Projetos\api-v3\app\Models\TabelaPreco.php`
  - `C:\Projetos\api-v3\app\Models\TabelaPrecoFilial.php`
  - `C:\Projetos\api-v3\app\Models\FormaPagamento.php`
  - `C:\Projetos\api-v3\app\Models\FormaPagamentoCondicaoPagamento.php`
  - `C:\Projetos\api-v3\app\Models\FormaPagamentoRestricao.php`
  - `C:\Projetos\api-v3\app\Models\FormaPagamentoExcecao.php`
  - `C:\Projetos\api-v3\routes\api.php`

## Comportamento migrado

### Condições de pagamento
- listagem server-side com:
  - `ID`
  - `Código`
  - `Nome`
  - `Prazo médio`
  - `Parcelas`
  - `Ativo`
- formulário por abas:
  - `Dados gerais`
  - `Filiais`
- `Filiais` funciona por vínculo relacional com lookup de filial e exclusão em lote

### Tabelas de preço
- listagem server-side com:
  - `ID`
  - `Código`
  - `Nome`
  - `Ativo`
- formulário por abas:
  - `Dados gerais`
  - `Filiais`
- `Filiais` mantém o campo `Padrão` no vínculo

### Formas de pagamento
- listagem server-side com:
  - `ID`
  - `Código`
  - `Nome`
  - `Tipo de pagamento`
  - `Restrito`
  - `Valida limite`
  - `Ativo`
- formulário por abas:
  - `Dados gerais`
  - `Condições de pagamento`
  - `Restrições`
  - `Exceções`
- helper texts do legado foram mantidos nos toggles operacionais
- `tipo = pix` e `tipo = cartao_credito` continuam forçando `internaliza_auto = false`, como no legado

## Contrato
- `Condições de pagamento`
  - leitura com `embed=filiais.filial`
  - escrita em `/condicoes_pagamento`
  - vínculo em `/condicoes_pagamento/filiais`
- `Tabelas de preço`
  - leitura com `embed=filiais.filial`
  - escrita em `/tabelas_preco`
  - vínculo em `/tabelas_preco/filiais`
- `Formas de pagamento`
  - leitura com `embed=condicoes_pagamento.condicao_pagamento,restricoes,excecoes`
  - escrita em `/formas_pagamento`
  - vínculos em:
    - `/formas_pagamento/condicoes_pagamento`
    - `/formas_pagamento/restricoes`
    - `/formas_pagamento/excecoes`

## Estrutura no v2
- bridges:
  - `app/api/condicoes-de-pagamento/*`
  - `app/api/tabelas-de-preco/*`
  - `app/api/formas-de-pagamento/*`
- features:
  - `src/features/condicoes-pagamento/*`
  - `src/features/tabelas-preco/*`
  - `src/features/formas-pagamento/*`
- rotas protegidas:
  - `/condicoes-de-pagamento`
  - `/tabelas-de-preco`
  - `/formas-de-pagamento`

## Cobertura mínima
- unitário:
  - serialização e normalização dos configs
  - labels e regra de `internaliza_auto` em `Formas de pagamento`
- E2E:
  - `Condições de pagamento`: criar, filtrar, editar, abrir aba `Filiais`, excluir
  - `Tabelas de preço`: criar, filtrar, editar, abrir aba `Filiais`, excluir
  - `Formas de pagamento`: criar, filtrar, editar, abrir abas `Condições`, `Restrições`, `Exceções`, excluir
