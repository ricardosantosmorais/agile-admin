# Evidencia - Catalogos Digitais - validacao visual e funcional

Data: 2026-05-19
Branch: `codex/catalogos-digitais-listagem-publica`
App validado: `http://127.0.0.1:3000`
Tenant visivel no topo: `Cescom Distribuidor - 1698203521854804`

## Contexto

- A autenticacao local estava funcional nesta rodada.
- O acesso ao modulo foi feito pelo menu real: `Catalogo > Catalogos Digitais`.
- A listagem carregou dados demo do tenant ativo.
- O ambiente informou que `mod_catalogos_digitais` nao esta contratado para a loja ativa; por isso, `Novo catalogo` apareceu desabilitado, conforme regra ja documentada.

## Validado no v2

- Acesso pelo menu `Catalogo > Catalogos Digitais`.
- Listagem em PT desktop/light com alerta de modulo nao contratado, tabela, paginacao, acoes por linha e botao `Novo catalogo` desabilitado.
- Edicao do catalogo demo `DEMO-CAT-001`.
- Etapa `Geral` com dados basicos, publicacao, vigencia e exibicao de preco.
- Etapa `Blocos` com 6 blocos e 12 produtos carregados do snapshot.
- Editor de bloco de produtos, incluindo campos do bloco, busca/resolucao/importacao e lista de produtos selecionados.
- Resolucao de produtos por IDs/codigos usando `2435 3118`, com retorno real da API no tenant ativo.
- Etapa `Resumo` em PT desktop/light com painel de contexto comercial de precificacao.
- Carregamento de opcoes comerciais no Resumo: filial, forma de pagamento, prazo, cliente, tabela, vendedor, quantidade, embalagem e frete.
- Acionamento de `Recalcular precos`; o fluxo retornou feedback `0 produtos precificados.` sem erro de console.
- Listagem e edicao em EN desktop/light. A listagem traduz colunas, acoes, alerta e paginacao; a edicao traduz shell, etapas e campos principais, preservando dados do snapshot.

## Evidencias visuais

Prints salvos em `evidence/screenshots/`:

- `catalogos-digitais-list-pt-desktop-light.png`
- `catalogos-digitais-edit-geral-pt-desktop-light.png`
- `catalogos-digitais-blocos-pt-desktop-light.png`
- `catalogos-digitais-produtos-pt-desktop-light.png`
- `catalogos-digitais-produtos-resolucao-pt-desktop-light.png`
- `catalogos-digitais-resumo-precificacao-pt-desktop-light.png`
- `catalogos-digitais-resumo-recalculo-pt-desktop-light.png`
- `catalogos-digitais-edit-en-desktop-light.png`

## Observacoes de dados reais

- Os produtos salvos no snapshot demo exibem nomes de vinho para IDs como `2435` e `3118`.
- A resolucao real desses IDs no tenant ativo retornou outros produtos (`DES.AER.AXE COMP.DARK TEMP.CHOCOLATE` e `PILHA RAYOVAC ALCALINA PALITO AAA SM`).
- Isso indica divergencia entre o snapshot demo salvo e o catalogo atual da API/tenant, portanto a validacao funcional de produtos foi considerada parcial e dependente de dado operacional alinhado.
- O recalc retornou `0 produtos precificados.` no contexto padrao carregado, sem erro de UI ou console. Ainda falta validar precificacao positiva com um conjunto de produto/cliente/filial/tabela que realmente precifique no tenant.

## Bloqueios e pendencias da validacao

- Mobile/dark nao foi fechado nesta rodada.
  - O viewport mobile do navegador embutido deixou o app sem conteudo renderizado no snapshot.
  - A tentativa de validar com Playwright local foi bloqueada porque o Chromium nao esta instalado em `C:\Users\ricar\AppData\Local\ms-playwright\chromium_headless_shell-1208\...`.
- A validacao visual comparativa contra o legado nao foi executada, porque nao havia ambiente legado renderizado disponivel nesta rodada.
- A acao `Previa do rascunho` foi acionada, mas o navegador embutido nao expos nova aba/popup verificavel. A bridge continua coberta por teste focado anterior; ainda falta validacao visual real da janela de preview em navegador com pop-ups habilitados.
- Nao foram executadas acoes destrutivas: exclusao por linha/massa nao foi confirmada e copia nao foi disparada para evitar criacao de dado operacional.
- PDF e publicacao continuam pendentes: segue sem contrato v2 equivalente ao pipeline legado de blob PDF e atualizacao de estado publico.

## Conclusao

O modulo avancou na validacao real autenticada de listagem, edicao, blocos, produtos, resumo e precificacao em desktop/light PT, com checagem parcial em EN. O modulo nao deve ser marcado como concluido enquanto faltarem mobile/dark, comparativo visual com legado, preview de rascunho verificavel em janela real, precificacao positiva com dados alinhados e contrato real de PDF/publicacao.
