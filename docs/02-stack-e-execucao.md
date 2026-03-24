# 02 - Stack e Execução

## Stack principal
Base observada em `C:\Projetos\admin-v2-web\package.json`:

- Next.js 16
- React 19
- TypeScript 5
- Tailwind CSS 4
- Lucide React para ícones
- Tiptap para editor rico
- React Dropzone para upload de imagem
- Recharts para gráficos

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`

## Como rodar localmente
1. Instalar dependências.
2. Executar `npm run dev`.
3. Abrir a aplicação no host/porta configurados pelo Next.

## Variáveis e ambiente
Pontos já observados no código:
- `AUTH_SESSION_SECRET`
- `AUTH_COOKIE_SECURE`
- `NODE_ENV`

Observação:
- a sessão HTTP do v2 usa cookie assinado no próprio app, então `AUTH_SESSION_SECRET` deve ser tratado como segredo real em produção.

## Build e validação mínima
O ciclo mínimo esperado antes de subir mudança é:
- `npm run lint`
- `npm run build`

No estado atual do projeto, esse é o baseline de verificação automática implementado e usado durante a migração.

