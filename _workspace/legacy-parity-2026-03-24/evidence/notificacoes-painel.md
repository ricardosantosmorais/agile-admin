# Evidence: notificacoes-painel

## Legacy commits checked

- `9b3bf870a` - `Corrige empresa selecionada em notificacoes painel e atualiza assets version`
- `603bfd968` - `Ajusta canais de notificacao do painel`
- `b9ac56208` - `Exibe audiencia por canal nas notificacoes`
- `b01dabc7d` - `Mostra canais de visualizacao por icone`

## Legacy behavior

- Company link now separates selected notification company from the current tenant.
- Valid panel notification channels are only `admin`, `email`, and `todos`; `novidades` was removed.
- Publishing sends push only for `admin`/`todos` and sends email only for `email`/`todos`.
- Publishing side effects only run when the notification is inside its display period.
- Audience list moved from `notificacoes_painel/usuarios` to `notificacoes_painel/audiencia` and displays the viewed channels.

## V2 comparison

- The selected company ID was already sent explicitly by `notificacoesPainelClient.addEmpresa`; the bridge tenant remains `session.currentTenantId`.
- V2 still exposed `novidades` in channel options and did not reject it on save/publish.
- V2 publishing always loaded/sent push before checking the channel.
- V2 users modal still loaded `notificacoes_painel/usuarios` and did not show channel icons.

## Migration

- Removed `novidades` from panel notification channel options and filters.
- Added bridge validation for `admin`, `email`, and `todos` during save and publish.
- Adjusted company linking to create draft push only when the notification channel sends push.
- Adjusted publish flow to:
  - load linked notification companies;
  - send push for `admin`/`todos`;
  - send email through `notificacoes_painel/email` for `email`/`todos`;
  - run push/email/changelog side effects only while the notification is vigente.
- Adjusted audience bridge to call `notificacoes_painel/audiencia` and support ordering by `canais`.
- Added viewed-channel icons to the users modal.

## Validation

- RED: notification tests failed for remaining `novidades`, old `/usuarios` endpoint, and email-channel push delivery.
- GREEN:
  - `.\npmw.cmd test -- src/features/notificacoes-painel/services/notificacoes-painel-mappers.test.ts app/api/notificacoes-painel/route.test.ts app/api/notificacoes-painel/[id]/empresas/route.test.ts app/api/notificacoes-painel/[id]/usuarios/route.test.ts app/api/notificacoes-painel/[id]/publicar/route.test.ts`
- Final checks:
  - `.\npxw.cmd eslint app/api/notificacoes-painel src/features/notificacoes-painel src/i18n/dictionaries/pt-BR.ts src/i18n/dictionaries/en-US.ts --max-warnings 0`
  - `.\npmw.cmd run typecheck`
  - `.\npxw.cmd eslint . --max-warnings 0`
  - `.\npmw.cmd run build`
