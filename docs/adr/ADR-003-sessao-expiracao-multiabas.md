# ADR-003 - Sessão, expiração e multiabas no frontend

## Status
Aceita

## Contexto
No legado, havia controle robusto de sessão, expiração e navegação multiabas.

No v2, não bastava redirecionar silenciosamente para login quando a sessão expirasse. Era necessário:
- manter experiência equivalente ao legado;
- avisar o usuário antes da expiração;
- permitir continuidade de sessão;
- propagar estado entre abas;
- bloquear o uso da aplicação quando a sessão realmente acabasse.

## Decisão
O v2 implementa controle de sessão no frontend com:
- contexto global de ciclo de vida da sessão;
- sincronização entre abas;
- modal de aviso antes da expiração;
- modal bloqueante de sessão encerrada;
- renovação explícita da sessão quando o usuário escolhe continuar.

## Consequências

### Positivas
- experiência mais clara e previsível para o usuário;
- comportamento alinhado ao legado;
- menor risco de perda silenciosa de contexto;
- suporte real a multiabas.

### Custos
- maior complexidade no frontend;
- necessidade de coordenar estado de sessão, auth e tenant;
- mais pontos de teste para o fluxo de expiração.

## Impacto
Essa decisão afeta diretamente:
- `auth-context`;
- `session-lifecycle-context`;
- guards de autenticação;
- fluxo de logout;
- tratamento global de `401`.
