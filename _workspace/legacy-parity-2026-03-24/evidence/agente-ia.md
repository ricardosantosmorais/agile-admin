# Evidence: agente-ia

Batch: `agente-ia`
Legacy date range: 2026-03-31..2026-04-01

## Legacy commits checked

| Commit | Legacy change | V2 decision |
|---|---|---|
| `565592a44` | Added scheduled execution UX to the legacy Agent IA chat/sidebar: schedule list panel, composer from user messages, schedule create/pause/resume/delete controller actions, scheduled-run badges, message identifiers and launcher integration. | Deferred. The current v2 has no native Agent IA chat/sidebar surface. It only embeds the external `Assistente de vendas IA` in `/configuracoes/assistente-vendas-ia`, so there is no equivalent component where this UX can be migrated without a product/module decision. |
| `2eac8a1ff` | Fixed history timestamp parsing in the legacy Agent IA chat by treating plain `YYYY-MM-DD HH:mm:ss` values as UTC before local rendering. | Deferred with the Agent IA chat surface. The current v2 does not render the legacy Agent IA conversation history; the external assistant owns its own UI inside the iframe. |
| `4e4da53ab` | Added dark-mode and contrast CSS for the legacy Agent IA sidebar, schedule panel, message bubbles, approvals, traces, attachments and overlay. | Deferred with the Agent IA chat surface. The current v2 does not carry the legacy sidebar markup/classes, and the existing iframe embed cannot safely receive those CSS rules from this repository. |

## V2 surface checked

- `src/features/configuracoes-assistente-vendas-ia/components/configuracoes-assistente-vendas-ia-page.tsx`
- `src/features/configuracoes-assistente-vendas-ia/services/assistente-vendas-ia-embed.ts`
- `app/api/configuracoes/assistente-vendas-ia/route.ts`
- `docs/41-modulo-configuracoes-assistentes-e-parametros.md`

## Conclusion

No production migration was made in this batch. The functional surface belongs to the legacy Agent IA chat/sidebar and should be reopened only when v2 receives a native Agent IA chat module, or when the external assistant embed exposes a supported contract for schedules/history/dark-mode integration.
