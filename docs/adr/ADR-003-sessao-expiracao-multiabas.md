# ADR-003 - Sessao, expiracao e multiabas no frontend

## Status
Aceita

## Contexto
No legado, havia controle robusto de sessao, expiracao e navegacao multiabas.

No v2, nao bastava redirecionar silenciosamente para login quando a sessao expirasse. Era necessario:
- manter experiencia equivalente ao legado;
- avisar o usuario antes da expiracao;
- permitir continuidade de sessao;
- propagar estado entre abas;
- bloquear o uso da aplicacao quando a sessao realmente acabasse.

## Decisao
O v2 implementa controle de sessao no frontend com:
- contexto global de ciclo de vida da sessao;
- sincronizacao entre abas;
- modal de aviso antes da expiracao;
- modal bloqueante de sessao encerrada;
- renovacao explicita da sessao quando o usuario escolhe continuar.

## Consequencias

### Positivas
- experiencia mais clara e previsivel para o usuario;
- comportamento alinhado ao legado;
- menor risco de perda silenciosa de contexto;
- suporte real a multiabas.

### Custos
- maior complexidade no frontend;
- necessidade de coordenar estado de sessao, auth e tenant;
- mais pontos de teste para o fluxo de expiracao.

## Impacto
Essa decisao afeta diretamente:
- `auth-context`;
- `session-lifecycle-context`;
- guards de autenticacao;
- fluxo de logout;
- tratamento global de `401`.
