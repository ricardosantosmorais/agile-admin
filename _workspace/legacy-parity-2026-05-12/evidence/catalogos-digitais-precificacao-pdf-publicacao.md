# Evidencia - Catalogos Digitais - precificacao, PDF e publicacao

Data: 2026-05-18
Branch: `codex/catalogos-digitais-listagem-publica`

## Legado consultado

- `C:\Projetos\admin\components\catalogos-studio.php`
- `C:\Projetos\admin\assets\js\components\catalogos-studio.js`
- `C:\Projetos\admin\controllers\catalogos-studio-controller.php`
- `C:\Projetos\admin\includes\catalogos-digitais-permissions.php`

## Precificacao no legado

- O Studio carrega contexto comercial via `precificacaoOptions`, incluindo filial, forma de pagamento, condicao de pagamento, tabela de preco, `modo_ecommerce` e cliente padrao.
- O recalculo usa `precificarProdutos` e `precificarSnapshot`.
- O payload preserva cliente, vendedor, filial, tabela, forma/condicao de pagamento, quantidade, embalagem, frete e o snapshot dos produtos.
- Em B2B, cliente e obrigatorio; em B2C/B2B2C, o cliente padrao pode ser aplicado.
- Produtos em secoes com `mostrar_preco !== false` recebem `preco_snapshot`, `preco_valor`, `preco_label`, `preco_status` e `precificacao_contexto`; itens rejeitados ficam com status/motivo de erro no snapshot.
- O contrato real de preco usa a API v2 `produtos`, com `id_empresa`, filtro do produto, `embalagens[ID]`, `quantidades[ID]`, cliente, filial, tabela, vendedor, forma/condicao de pagamento, indice e frete.

## Implementacao v2

- `POST /api/catalogos-digitais/studio` agora aceita:
  - `pricingOptions` / `precificacaoOptions`;
  - `priceProducts` / `precificarProdutos`;
  - `priceSnapshot` / `precificarSnapshot`.
- A bridge reaproveita `agileV2Fetch` de `app/api/consultas/_shared`, mesma base usada por `app/api/consultas/simulador-precos/route.ts`.
- O passo `Resumo` do Studio ganhou o painel `Contexto de precificacao`.
- O usuario pode informar filial, forma de pagamento, prazo, cliente, tabela, vendedor, embalagem, quantidade e frete.
- O botao `Recalcular precos` envia o snapshot atual, incluindo bloco em edicao, e grava de volta produtos/secoes/snapshot precificados antes de salvar o catalogo.
- Strings novas foram adicionadas aos dicionarios PT/EN.

## PDF e publicacao

- O legado tem acao `pdf` que envia o snapshot para o controller, espera um blob `application/pdf` e dispara download do arquivo.
- A publicacao legado deriva `modo_publicacao`, `url_publica` e `publicado`; URL publica so e tratada como pronta quando existe URL, `publicado` e `status === "pronto"`.
- No v2 atual existe renderizacao HTML de snapshot salvo e preview HTML de rascunho, mas nao existe contrato real equivalente para gerar PDF/publicar a pagina.
- Por isso, PDF/publicacao nao foram fingidos nesta rodada. A pendencia real e expor uma decisao/contrato backend para gerar PDF e atualizar estado de publicacao a partir do snapshot v2.

## Validacoes executadas

```powershell
.\npxw.cmd vitest run app/api/catalogos-digitais/route.test.ts src/features/catalogos-digitais/services/catalogos-digitais-client.test.ts src/features/catalogos-digitais/components/catalogos-digitais-form-page.test.tsx src/features/catalogos-digitais/components/catalogos-digitais-list-page.test.tsx src/features/catalogos-digitais/services/catalogos-digitais-mappers.test.ts --testTimeout=15000
```

Resultado: 5 arquivos, 32 testes, todos passando.

```powershell
.\npxw.cmd eslint app/api/catalogos-digitais/studio/route.ts app/api/catalogos-digitais/route.test.ts src/features/catalogos-digitais/components/catalogos-digitais-form-page.tsx src/features/catalogos-digitais/components/catalogos-digitais-form-page.test.tsx src/features/catalogos-digitais/services/catalogos-digitais-client.ts src/features/catalogos-digitais/services/catalogos-digitais-client.test.ts src/features/catalogos-digitais/types/catalogos-digitais.ts src/i18n/dictionaries/pt-BR.ts src/i18n/dictionaries/en-US.ts
```

Resultado: sem erros.

```powershell
.\npmw.cmd run typecheck
```

Resultado: `tsc --noEmit` sem erros.

## Validacao visual

- Tentativa local em `http://127.0.0.1:3000/catalogos-digitais/novo`.
- O app redirecionou para `/login?from=%2Fcatalogos-digitais%2Fnovo`.
- A tela de login estava visualmente renderizada, mas ao acionar `Continuar` o botao ficou em `Processando...` e nao completou autenticacao/navegacao.
- Por esse bloqueio de sessao/backend local, nao foi possivel executar a validacao visual comparativa real do Studio contra o legado nesta rodada.

## Pendencias reais

- Validar visualmente o fluxo completo contra o legado em PT/EN, desktop/mobile e light/dark.
- Validar funcionalmente com dados reais de tenant/produtos/clientes quando houver ambiente autenticado disponivel.
- Definir/implementar contrato real para PDF e publicacao antes de chamar o modulo de concluido.
