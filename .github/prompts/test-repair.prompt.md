---
name: "Test Repair Run"
description: "Run the repository validation flow, fix code or tests when possible, and report blockers that depend on human action."
agent: "Test Repair"
---

Execute the local automated test-maintenance flow for this repository.

Instructions:
- Read AGENTS.md before making changes.
- Follow docs/10-estrategia-de-testes.md.
- Use the scripts from package.json.
- Keep changes minimal and cohesive.
- Correct the root cause whenever possible.
- If a failure depends on human action, stop trying to automate that part and report it clearly.

Default order:
- npm run test
- npm run lint
- npm run typecheck
- npm run test:e2e
- npm run build only if required by the nature of the change

At the end, report:
- failures found
- fixes applied
- validations that passed
- remaining blockers
- "Ação humana necessária" when applicable