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
- etapa Resumo preservando o snapshot até a migração completa de upload, produtos, precificação, preview, PDF e publicação;
- preservação do snapshot legado de produtos e seções ao salvar esta primeira fatia;
- ação de criação e edição na listagem seguindo `PageHeader` e `AppDataTable`.

### Lacuna atual da listagem

A listagem avançou na recuperação das ações do legado. O v2 já mostra `Prévia/Visualizar`, `Copiar`, `Editar`, `Excluir`, seleção por checkbox e exclusão em massa, com permissões equivalentes e confirmação antes da exclusão. A ação de prévia abre `url_publica` quando disponível, e a cópia usa detalhe + gravação com identidade/código limpos.

Antes de encerrar a tela de listagem, migrar ou registrar explicitamente como pendente:

- prévia HTML equivalente ao Studio legado quando o catálogo ainda não tiver URL pública;
- link externo no nome quando o catálogo estiver publicado e pronto;
- validação visual completa dos estados da tabela em PT/EN, desktop/mobile, light/dark.

## Decisão de corte

O legado entrega um studio amplo no mesmo componente, com criação, edição, blocos, produtos, importação de coleção, precificação, preview HTML, PDF e publicação. Para reduzir risco, a migração foi dividida.

O formulário atual já segue o fluxo visual do Studio legado em três etapas. A etapa `Blocos` edita a estrutura básica das seções e preserva os dados no snapshot para não perder conteúdo vindo do legado. Upload tenant-aware, busca/importação de produtos, precificação, preview, PDF e publicação continuam separados para reduzir risco e manter o contrato real verificável.

O corte por fatias não autoriza perda funcional silenciosa. Cada tela deve fechar a paridade inteira do legado antes de sair de pendente: nenhum botão, texto, campo, filtro, modal, ação, validação, payload ou permissão deve desaparecer sem registro no batch e neste documento.

## Próximas fatias

Status: retomado após atualização da base local.

1. Upload de imagens por empresa.
2. Busca, resolução e importação de produtos/coleções.
3. Precificação e snapshot.
4. Preview, PDF e publicação.
5. Fechar a listagem com link público no nome, prévia HTML sem URL pública e validação visual final.
6. Validação visual do studio completo em PT/EN, desktop/mobile, light/dark.

Cada fatia deve comparar novamente o controller legado e preservar o comportamento funcional sem reproduzir o acoplamento antigo.
