# ADR-006 - Observabilidade centralizada com Sentry no App Router

## Status
Aceita

## Contexto
O v2 passou a precisar de observabilidade real tanto no navegador quanto no server-side.

Não era desejável espalhar captura manual em cada módulo, porque isso:
- aumenta duplicação;
- reduz consistência;
- torna o monitoramento dependente da disciplina de cada feature.

## Decisão
O projeto adota Sentry como camada de observabilidade centralizada, integrada ao App Router e à infraestrutura compartilhada.

A captura deve ficar principalmente em:
- `instrumentation.ts`;
- `instrumentation-client.ts`;
- configurações server e edge;
- infraestrutura de sessão e HTTP;
- tratamento global de erro.

## Consequências

### Positivas
- erros relevantes passam a ser monitorados em um ponto consistente;
- o frontend e as bridges conseguem registrar contexto de usuário e tenant;
- o projeto evita espalhar captura manual por feature.

### Custos
- depende de variáveis de ambiente corretas para funcionar plenamente;
- sourcemaps exigem token específico no build;
- há cuidado extra com PII e payloads sensíveis.

## Impacto
Essa decisão afeta:
- integração com Sentry no client, server e edge;
- documentação de ambiente;
- tratamento de erros em infraestrutura compartilhada;
- fluxo de debug e suporte do time.
