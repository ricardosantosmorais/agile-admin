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
- tabela v2 alinhada ao legado com código, nome, vigência, status e ações;
- filtros recolhidos no padrão v2 para código, nome, vigência e status;
- ação `Novo catálogo` bloqueada quando `mod_catalogos_digitais` não estiver contratado, mantendo apenas a listagem administrativa;
- estados de loading, erro e vazio via componentes compartilhados.
- rota protegida `/catalogos-digitais/novo`;
- rota protegida `/catalogos-digitais/[id]/editar`;
- bridge de detalhe `app/api/catalogos-digitais/[id]` com `embed=produtos`;
- bridge de gravação em `app/api/catalogos-digitais`;
- formulário v2 no fluxo passo a passo do legado: Geral, Blocos e Resumo;
- etapa Geral com dados básicos, página no site, vigência e exibição de preço;
- etapas Blocos e Resumo preservando o snapshot até a migração completa da montagem visual, preview, PDF e publicação;
- preservação do snapshot legado de produtos e seções ao salvar esta primeira fatia;
- ação de criação e edição na listagem seguindo `PageHeader` e `AppDataTable`.

## Decisão de corte

O legado entrega um studio amplo no mesmo componente, com criação, edição, blocos, produtos, importação de coleção, precificação, preview HTML, PDF e publicação. Para reduzir risco, a migração foi dividida.

O formulário atual já segue o fluxo visual do Studio legado em três etapas. Ele ainda não edita blocos/produtos diretamente, mas preserva os dados existentes no snapshot para não perder conteúdo vindo do legado enquanto as próximas fatias não são migradas.

## Próximas fatias

Status: retomado após atualização da base local.

1. Blocos/seções e upload de imagens por empresa.
2. Busca, resolução e importação de produtos/coleções.
3. Precificação e snapshot.
4. Preview, PDF e publicação.
5. Validação visual do studio completo em PT/EN, desktop/mobile.

Cada fatia deve comparar novamente o controller legado e preservar o comportamento funcional sem reproduzir o acoplamento antigo.
