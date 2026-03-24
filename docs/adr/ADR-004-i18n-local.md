# ADR-004 - I18n local no frontend, sem dependencia de banco

## Status
Aceita

## Contexto
O v2 precisava de versao em portugues e ingles.

Parte dos textos vem do banco, especialmente no menu e em conteudos dinamicos. Mesmo assim, nao era desejavel introduzir persistencia de traducao em banco para a aplicacao inteira.

Era necessario:
- permitir troca de idioma no frontend;
- manter portugues como padrao;
- traduzir shell, menu, formularios, listagens e mensagens fixas;
- ter fallback para textos dinamicos vindos da API.

## Decisao
O v2 adota i18n local no frontend, com dicionarios versionados no proprio projeto.

## Consequencias

### Positivas
- traducao controlada por codigo;
- revisao e versionamento no mesmo fluxo do frontend;
- independencia de banco para os textos fixos;
- simplicidade para crescer em etapas.

### Custos
- exige manutencao disciplinada dos dicionarios;
- textos livres vindos do backend nao entram automaticamente nesse modelo;
- chaves mal definidas ou fallbacks errados podem vazar para a UI.

## Impacto
Essa decisao afeta:
- menu;
- breadcrumbs;
- formularios;
- tabelas;
- modais;
- componentes compartilhados;
- telas de senha e sessao.
