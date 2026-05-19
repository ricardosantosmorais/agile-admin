# Evidencia - Catalogos Digitais - preview, PDF e publicacao

Data: 2026-05-19
Branch: `codex/catalogos-digitais-listagem-publica`

## Escopo

- Revalidar a previa de rascunho em janela/aba observavel.
- Rechecar se existe contrato real para PDF/publicacao no v2/API/legado.
- Registrar o recorte visual possivel em dark/mobile.
- Nao simular PDF/publicacao sem contrato utilizavel.

## Contrato PDF/publicacao

Legado consultado:

- `C:\Projetos\admin\controllers\catalogos-studio-controller.php`
- `C:\Projetos\admin\assets\js\components\catalogos-studio.js`

API/v2 consultados:

- `C:\Projetos\api-v3\app\Models\CatalogoDigital.php`
- `C:\Projetos\api-v3\app\Models\CatalogoDigitalGeracao.php`
- `C:\Projetos\api-v3\database\sql\2026-05-03_catalogos_digitais_tenant.sql`
- `app/api/catalogos-digitais/[id]/preview-html`
- `app/api/catalogos-digitais/studio`

Resultado:

- O legado tem acao real `pdf`, renderiza HTML e usa Chrome/Chromium headless no PHP para devolver blob PDF.
- O legado persiste `modo_publicacao`, `restrito`, `publicado` e calcula URL publica a partir da empresa, modo, slug/codigo.
- A API v3 tem modelos/tabelas com `pdf_url`, `html_url` e geracoes, mas as rotas atuais expostas ao v2 sao CRUD generico. Nao foi encontrado endpoint real para gerar PDF ou publicar a pagina a partir do snapshot.
- O v2 atual cobre preview HTML de snapshot salvo e preview HTML de rascunho, mas nao cobre a geracao de PDF nem uma publicacao equivalente ao pipeline legado.

Decisao:

- PDF/publicacao permanecem pendencia real de contrato backend.
- O modulo nao deve ser marcado como concluido ate haver endpoint/contrato explicito para gerar PDF e publicar/atualizar estado publico.

## Preview de rascunho

Problema encontrado:

- A previa era aberta depois da chamada assincrona `previewDraft` e com `noopener,noreferrer`, deixando a nova janela vulneravel a bloqueio de popup e sem handle confiavel para `document.write`.

Correcao aplicada:

- `openDraftPreview()` agora abre `about:blank` sincronamente no clique, antes de chamar `previewDraft`.
- Se o navegador bloquear a janela, o fluxo mostra o feedback existente e nao chama a bridge.
- A aba aberta permanece gravavel para receber o HTML retornado pela bridge.

Validacao:

- Browser/Playwright autenticado em `http://127.0.0.1:3000/catalogos-digitais/DEMO-CAT-001/editar`.
- Caminho: `Resumo` > `Previa do rascunho`.
- Resultado: abriu nova aba com titulo `Agile B2B | Campanha B2B com Preco` e HTML renderizado do catalogo.

## Dark e mobile

- Desktop/dark: revalidado na tela de edicao/resumo autenticada; controles principais e preview permaneceram acessiveis.
- Mobile 390x844/dark no MCP Playwright: conteudo do app renderizou com header, etapas e resumo acessiveis.
- Observacao: a validacao anterior no Codex in-app browser continuava registrada como bloqueada em mobile por tela vazia; nesta rodada o MCP Playwright permitiu cobrir o recorte mobile.

## Precificacao positiva

- A rodada anterior carregou opcoes comerciais e `Recalcular precos` respondeu de forma controlada com `0 produtos precificados`.
- Nesta rodada nao houve dado operacional adicional alinhado para fechar um caso positivo de produto/cliente/filial/tabela.
- Pendencia permanece bloqueada por dados operacionais alinhados, nao por erro novo do front.

## Comparacao visual com legado

- Nao havia ambiente legado renderizavel disponivel nesta rodada.
- A comparacao visual direta com o Studio legado permanece pendente.

## Validacoes focadas

```powershell
.\npxw.cmd vitest run src/features/catalogos-digitais/components/catalogos-digitais-form-page.test.tsx --testTimeout=15000
```

Resultado: executado em ciclo red/green para proteger a abertura sincronica da previa; apos o ajuste, 9 testes passaram.
