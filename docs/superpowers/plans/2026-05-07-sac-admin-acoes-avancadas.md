# SAC admin ações avançadas - plano

## Passos

1. Cobrir mappers/permissões e lookups com testes unitários.
2. Cobrir bridges de áreas, assuntos e usuários com testes de rota.
3. Cobrir ações avançadas no componente com `updated_at`.
4. Implementar bridges e client SAC sem alterar menu fixo.
5. Evoluir `/sac` com filtros relacionais e formulários operacionais.
6. Atualizar i18n, documentação e inventário de migração.
7. Rodar validação focada, typecheck, lint, diff check e build.

## Critério de aceite

- Nenhuma nova entrada fixa de menu é adicionada.
- A UI responde às permissões finas herdadas do legado.
- Todas as ações avançadas enviam `updated_at`.
- A listagem respeita `SAC_FUNC_LISTAR_TODOS`.
- Pontos ainda fora da fatia permanecem registrados.
