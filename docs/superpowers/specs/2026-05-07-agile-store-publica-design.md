# Agile Store Publica - Design

## Escopo

Migrar a fatia publica da Agile Store criada no legado entre 2026-04-30 e 2026-05-03. Esta etapa entrega vitrine, detalhe e acoes de contratacao para modulos, usando a API v3 como contrato real.

Ficam fora desta etapa: SAC administrativo, chamados, areas/assuntos, configuracoes do SAC, retaguarda de gestao da Agile Store, metricas, visitas e faturamento.

## Arquitetura

A Agile Store sera uma feature propria em `src/features/agile-store`, sem reaproveitar `CrudListPage`, porque o legado e uma vitrine operacional/comercial com cards, galeria, status e acoes por modulo. A integracao com a API v3 passara por bridges em `app/api/agile-store/*`.

Rotas v2:
- `/agile-store`: listagem publica de modulos.
- `/agile-store/[id]`: detalhe do modulo.

Contratos API v3:
- `GET /app-store/modulos`
- `GET /app-store/modulos/{id}`
- `POST /app-store/modulos/{id}/contratar`
- `POST /app-store/modulos/{id}/descontratar`
- `POST /app-store/modulos/{id}/reprocessar`

## Permissoes

A feature usara as chaves do legado:
- `APP_STORE`
- `APP_STORE_VISUALIZAR`
- `APP_STORE_CONTRATAR`
- `APP_STORE_DESCONTRATAR`

O menu e o acesso devem respeitar a sessao atual. Usuarios master continuam liberados pelo mecanismo padrao do v2.

## UI

A listagem tera busca, filtro por tipo, filtro por status e cards com imagem, icone, beneficios, preco, teste gratis e status. O detalhe tera hero, midias, beneficios, informacoes comerciais, historico de contratacao quando retornado pela API, e botoes condicionais por status/permissao/policy `acoes`.

## Erros

As bridges devem devolver mensagens normalizadas para sessao expirada, permissao negada e falhas da API v3. A UI exibe erro contextual e preserva estado vazio quando a lista retornar sem dados.

## Testes

Cobertura minima desta etapa:
- mapeadores da lista, detalhe e policy de acoes;
- bridge de listagem/detalhe/acao com construcao correta de path e payload;
- renderizacao basica da listagem/detalhe com estados de sucesso e bloqueio de acao.
