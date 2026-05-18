# Catálogos Digitais - primeira fatia do studio

Data: 2026-05-14

## Legado analisado

- `C:\Projetos\admin\controllers\catalogos-studio-controller.php`
- `C:\Projetos\admin\assets\js\components\catalogos-studio.js`

## Comportamento migrado

- Listagem abre criação em `/catalogos-digitais/novo`.
- Listagem abre edição em `/catalogos-digitais/[id]/editar`.
- Detalhe consulta `catalogos_digitais` com `id_empresa`, `id`, `embed=produtos` e `perpage=1`.
- Gravação envia o payload normalizado para `catalogos_digitais`.
- Formulário cobre dados gerais e publicação: nome, chamada, modelo, template, objetivo, vigência, modo de publicação, exibição de preço e ativo.
- Ao salvar, produtos e seções existentes no snapshot legado são preservados para evitar perda de dados enquanto as próximas fatias do studio não são migradas.

## Testes executados

```powershell
.\npxw.cmd vitest run src/features/catalogos-digitais/services/catalogos-digitais-mappers.test.ts app/api/catalogos-digitais/route.test.ts src/features/catalogos-digitais/components/catalogos-digitais-list-page.test.tsx src/features/catalogos-digitais/components/catalogos-digitais-form-page.test.tsx
```

Resultado: 4 arquivos, 11 testes aprovados.

## Pendências

- Editor de blocos/seções.
- Upload de imagens por empresa.
- Busca/importação de produtos e coleções.
- Precificação e snapshot completo.
- Preview HTML, PDF e publicação.
