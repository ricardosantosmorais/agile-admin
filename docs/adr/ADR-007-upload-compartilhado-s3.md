# ADR-007 - Estratégia de upload compartilhado com preparação para S3

## Status
Aceita

## Contexto
O legado usa múltiplos destinos de upload, com diferenças por módulo:
- bucket público por tenant;
- bucket privado global;
- pastas distintas;
- tipos de arquivo distintos;
- respostas diferentes entre telas.

Não fazia sentido reproduzir upload ad hoc em cada feature do v2.

## Decisão
O v2 adota base compartilhada de upload, com separação entre:
- componente visual;
- profile técnico de upload;
- pasta ou destino por módulo;
- bridge preparada para rollout real em S3.

## Consequências

### Positivas
- UI de upload consistente entre módulos;
- preparação para S3 sem acoplar telas ao provider;
- cada feature pode manter destino próprio sem duplicar base visual.

### Custos
- rollout completo depende de validar cada módulo contra o legado;
- parte do sistema ainda convive com fallback ou fluxo legado;
- exige documentação clara de profiles e destinos.

## Impacto
Essa decisão afeta:
- componentes compartilhados de upload;
- `app/api/uploads`;
- variáveis de ambiente de S3;
- módulos que usam imagem ou arquivo no catálogo e marketing.
