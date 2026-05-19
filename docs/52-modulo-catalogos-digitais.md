# 52 - Módulo Catálogos Digitais

## Origem no legado

- Funcionalidade raiz: `CATALOGOS_DIGITAIS`.
- Componente dinâmico de menu: `catalogos-studio`.
- Módulo de contratação na Agile Store: `mod_catalogos_digitais`.
- Controller legado analisado: `controllers/catalogos-studio-controller.php`.
- Permissões legadas analisadas: `includes/catalogos-digitais-permissions.php` e `scripts/sql/2026-05-04-catalogos-digitais-studio-permissoes.sql`.

## Cobertura v2 atual

A cobertura migrada cria a superfície de entrada, listagem e a primeira fatia do studio:

- rota protegida `/catalogos-digitais`;
- mapeamento do componente dinâmico `catalogos-studio` para a rota v2;
- chave de permissão `catalogosDigitais` com matchers para os nomes/códigos do legado;
- bridge `app/api/catalogos-digitais`;
- listagem real consumindo `catalogos_digitais` na API v3;
- consulta paralela à Agile Store para identificar contratação do módulo;
- alerta v2 quando `mod_catalogos_digitais` ainda não estiver contratado;
- tabela v2 parcial com código, nome, vigência, status e ações;
- filtros recolhidos no padrão v2 para código, nome, vigência e status;
- ação `Novo catálogo` bloqueada quando `mod_catalogos_digitais` não estiver contratado, mantendo apenas a listagem administrativa;
- ações legadas de listagem recuperadas: prévia por URL pública, copiar catálogo, excluir por linha, seleção por checkbox e exclusão em massa;
- bridge `DELETE /api/catalogos-digitais` com payload tenant-aware;
- bridge `GET /api/catalogos-digitais/[id]/preview-html` para prévia HTML de snapshots salvos sem URL pública;
- estados de loading, erro e vazio via componentes compartilhados.
- rota protegida `/catalogos-digitais/novo`;
- rota protegida `/catalogos-digitais/[id]/editar`;
- bridge de detalhe `app/api/catalogos-digitais/[id]` com `embed=produtos`;
- bridge de gravação em `app/api/catalogos-digitais`;
- formulário v2 no fluxo passo a passo do legado: Geral, Blocos e Resumo;
- etapa Geral com dados básicos, página no site, vigência e exibição de preço;
- etapa Blocos com editor básico de seções, criação por tipo legado, edição, reordenação e remoção;
- tipos de seção preservados do Studio legado: `banner`, `titulo`, `produtos_grid`, `produtos_lista`, `texto`, `cta`, `divisor`, `espacador` e `quebra_pagina`;
- campos do bloco gravados no snapshot: modelo, título, subtítulo, URL de imagem, cores, espaçamento, fonte, produtos, HTML e exibição de preço;
- upload tenant-aware da imagem dos blocos, via bridge compartilhada `/api/uploads`, usando bucket/pasta da empresa ativa;
- validação de imagem dos blocos em JPG, PNG, GIF ou WEBP, com limite de 5 MB antes do envio;
- busca de produtos no Studio via bridge v2, preservando os filtros legados por nome, código ou ID;
- resolução de lista de produtos por códigos/IDs, com retorno de itens não encontrados;
- importação de coleção por ID, preservando a ordem dos produtos retornada pelo legado;
- inclusão de produto no bloco sem perder o snapshot de produtos do catálogo;
- prévia HTML de rascunho do builder a partir do estado atual do formulário, sem exigir catálogo salvo;
- etapa Resumo com contexto comercial de precificação e recálculo de snapshot;
- bridge `POST /api/catalogos-digitais/studio` para `pricingOptions`/`precificacaoOptions`, `priceProducts`/`precificarProdutos` e `priceSnapshot`/`precificarSnapshot`;
- recálculo de preços usando a API v2 `produtos`, preservando cliente, filial, tabela, vendedor, forma/condição de pagamento, quantidade, embalagem, frete e snapshot de produtos/seções;
- etapa Resumo preservando o snapshot até a migração completa de PDF e publicação;
- preservação do snapshot legado de produtos e seções ao salvar esta primeira fatia;
- ação de criação e edição na listagem seguindo `PageHeader` e `AppDataTable`.

### Lacuna atual da listagem

A listagem avançou na recuperação das ações do legado. O v2 já mostra `Prévia/Visualizar`, `Copiar`, `Editar`, `Excluir`, seleção por checkbox e exclusão em massa, com permissões equivalentes e confirmação antes da exclusão. O botão `Copiar` segue a permissão legada `criar` mesmo quando o módulo não está contratado; nesse caso, a ação informa o bloqueio de contratação antes de chamar detalhe/gravação. A ação de prévia abre `url_publica` apenas quando o catálogo tem URL, está publicado e está com status `pronto`; sem essa condição, abre a bridge HTML do v2 para renderizar o snapshot salvo do catálogo. A cópia usa detalhe + gravação com identidade/código limpos.

Antes de encerrar a tela de listagem, migrar ou registrar explicitamente como pendente:

- validação visual completa dos estados da tabela em PT/EN, desktop/mobile, light/dark. Em 2026-05-19 houve validação autenticada em PT desktop/light, validação parcial em EN desktop/light e recorte adicional em dark/mobile pelo MCP Playwright; a validação comparativa completa continua pendente junto do Studio completo.

## Decisão de corte

O legado entrega um studio amplo no mesmo componente, com criação, edição, blocos, produtos, importação de coleção, precificação, preview HTML, PDF e publicação. Para reduzir risco, a migração foi dividida.

O formulário atual já segue o fluxo visual do Studio legado em três etapas. A etapa `Blocos` edita a estrutura básica das seções, envia imagens de blocos para o bucket da empresa ativa, busca/resolução/importação de produtos e preserva os dados no snapshot para não perder conteúdo vindo do legado. A etapa `Resumo` já gera prévia HTML de rascunho do builder pela bridge v2 e recalcula preços com contexto comercial usando o contrato real da API v2. PDF e publicação continuam separados porque ainda não há contrato v2 equivalente ao pipeline legado de blob PDF e atualização de estado público.

O corte por fatias não autoriza perda funcional silenciosa. Cada tela deve fechar a paridade inteira do legado antes de sair de pendente: nenhum botão, texto, campo, filtro, modal, ação, validação, payload ou permissão deve desaparecer sem registro no batch e neste documento.

## Próximas fatias

Status: retomado após atualização da base local. A validação funcional autenticada avançou em 2026-05-19 para listagem, edição, blocos, produtos, resumo, painel de precificação, prévia de rascunho em nova aba observável e recorte dark/mobile, mas o módulo permanece parcial.

1. PDF e publicação: continua como pendência real de contrato backend; o legado gera PDF via Chrome/Chromium headless no PHP, enquanto v2/API atual só expõe CRUD, gerações e preview HTML.
2. Validação funcional completa do Studio com dados operacionais alinhados para produto/cliente/filial/tabela e precificação positiva.
3. Validação visual do Studio completo em PT/EN, desktop/mobile, light/dark.
4. Comparação visual com o legado quando houver ambiente legado renderizável.

Cada fatia deve comparar novamente o controller legado e preservar o comportamento funcional sem reproduzir o acoplamento antigo.
