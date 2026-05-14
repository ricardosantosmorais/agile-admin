# 52 - Módulo Catálogos Digitais

## Origem no legado

- Funcionalidade raiz: `CATALOGOS_DIGITAIS`.
- Componente dinâmico de menu: `catalogos-studio`.
- Módulo de contratação na Agile Store: `mod_catalogos_digitais`.
- Controller legado analisado: `controllers/catalogos-studio-controller.php`.
- Permissões legadas analisadas: `includes/catalogos-digitais-permissions.php` e `scripts/sql/2026-05-04-catalogos-digitais-studio-permissoes.sql`.

## Cobertura v2 atual

A primeira fatia migrada cria a superfície de entrada e listagem:

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

## Decisão de corte

O legado entrega um studio amplo no mesmo componente, com criação, edição, blocos, produtos, importação de coleção, precificação, preview HTML, PDF e publicação. Para reduzir risco, a migração foi dividida.

Esta primeira entrega não cria um editor parcial. Ela apenas habilita o acesso, a listagem e o registro visual/operacional do módulo no padrão v2.

## Próximas fatias

1. Formulário/studio de criação e edição de catálogo.
2. Blocos/seções e upload de imagens por empresa.
3. Busca, resolução e importação de produtos/coleções.
4. Precificação e snapshot.
5. Preview, PDF e publicação.

Cada fatia deve comparar novamente o controller legado e preservar o comportamento funcional sem reproduzir o acoplamento antigo.
