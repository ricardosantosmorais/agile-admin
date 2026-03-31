# ADR-004 - I18n local no frontend, sem dependência de banco

## Status
Aceita

## Contexto
O v2 precisava de versão em português e inglês.

Parte dos textos vem do banco, especialmente no menu e em conteúdos dinâmicos. Mesmo assim, não era desejável introduzir persistência de tradução em banco para a aplicação inteira.

Era necessário:
- permitir troca de idioma no frontend;
- manter português como padrão;
- traduzir shell, menu, formulários, listagens e mensagens fixas;
- ter fallback para textos dinâmicos vindos da API.

## Decisão
O v2 adota i18n local no frontend, com dicionários versionados no próprio projeto.

## Consequências

### Positivas
- tradução controlada por código;
- revisão e versionamento no mesmo fluxo do frontend;
- independência de banco para os textos fixos;
- simplicidade para crescer em etapas.

### Custos
- exige manutenção disciplinada dos dicionários;
- textos livres vindos do backend não entram automaticamente nesse modelo;
- chaves mal definidas ou fallbacks errados podem vazar para a UI.

## Impacto
Essa decisão afeta:
- menu;
- breadcrumbs;
- formulários;
- tabelas;
- modais;
- componentes compartilhados;
- telas de senha e sessão.
