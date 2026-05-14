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
- tabela v2 com status, publicação, produtos, blocos, vigência e URL pública;
- filtros iniciais por busca e status;
- estados de loading, erro e vazio via componentes compartilhados.
- rota protegida `/catalogos-digitais/novo`;
- rota protegida `/catalogos-digitais/[id]/editar`;
- bridge de detalhe `app/api/catalogos-digitais/[id]` com `embed=produtos`;
- bridge de gravação em `app/api/catalogos-digitais`;
- formulário v2 de dados gerais e publicação do catálogo;
- preservação do snapshot legado de produtos e seções ao salvar esta primeira fatia;
- ação de criação e edição na listagem seguindo `PageHeader` e `AppDataTable`.

## Decisão de corte

O legado entrega um studio amplo no mesmo componente, com criação, edição, blocos, produtos, importação de coleção, precificação, preview HTML, PDF e publicação. Para reduzir risco, a migração foi dividida.

O formulário atual cobre apenas os dados gerais e a publicação. Ele não edita blocos/produtos ainda, mas preserva os dados existentes no snapshot para não perder conteúdo vindo do legado enquanto as próximas fatias não são migradas.

## Próximas fatias

Status: retomado após atualização da base local.

1. Blocos/seções e upload de imagens por empresa.
2. Busca, resolução e importação de produtos/coleções.
3. Precificação e snapshot.
4. Preview, PDF e publicação.
5. Validação visual do studio completo em PT/EN, desktop/mobile.

Cada fatia deve comparar novamente o controller legado e preservar o comportamento funcional sem reproduzir o acoplamento antigo.
