# Batch: catalogos-digitais

Initial priority: 1
Initial disposition: analyze-first

## Legacy commits

| Date | Commit | Subject |
|---|---|---|
| 2026-05-07 | 8407206ef | Adiciona studio de catalogos digitais |
| 2026-05-07 | 6da0b69f2 | Restringe catalogos digitais ao usuario autorizado |
| 2026-05-07 | c327433a2 | Libera catalogos digitais para usuario local |
| 2026-05-07 | 775bd6a65 | Restaura Catálogos Digitais e preserva ajustes remotos |
| 2026-05-07 | 3148bb3f4 | Remove fallback local dos produtos nos catálogos |
| 2026-05-07 | c06bd6f42 | Ajusta consulta de produtos dos catalogos pela API |
| 2026-05-08 | 0e2338556 | Finaliza preparo de produção dos catálogos digitais |
| 2026-05-08 | dd96f9a63 | fix: preserve catalog mock json in loja demo seed |
| 2026-05-08 | 58e8aae63 | feat: publicar catalogos digitais no admin |
| 2026-05-08 | d1dd9058a | Ajusta catalogos digitais e loja de apps |
| 2026-05-09 | 5a549409d | Atualiza poster do video de Catalogos Digitais |
| 2026-05-09 | 7c2f1dd7d | Protege Catalogos Digitais por contratacao |
| 2026-05-09 | 05fc0eaa8 | Libera saidas de Catalogos Digitais sem contratacao |
| 2026-05-09 | 0873772b4 | Corrige geração de PDF dos catálogos |
| 2026-05-09 | 72e82b105 | Corrige renderizacao de imagens e HTML em catalogos |
| 2026-05-10 | 815266a8f | Corrige imagem de produto integrado em catalogos |
| 2026-05-10 | 10fc5694e | Usa credenciais do tenant no upload de catalogos |
| 2026-05-10 | 597d6531d | Corrige contexto de recalculo em catalogos |
| 2026-05-10 | 394cf9635 | Corrige correspondencia de produtos no recalculo |
| 2026-05-10 | c3da19496 | Inclui bloco em edicao no recalculo de catalogos |
| 2026-05-10 | ddd01e4f5 | Corrige resolucao de cliente em catalogos |
| 2026-05-10 | 37816f99e | Robustece recalculo de precos em catalogos |
| 2026-05-10 | 41f8cbc1d | Exibe motivo do recalculo sem preco |
| 2026-05-10 | 3e494d345 | Corrige recalculo de catalogos integrados |
| 2026-05-10 | a9225a451 | Corrige cliente salvo no recalculo de catalogos |
| 2026-05-11 | 086d39048 | fix(admin): permitir pdf de catalogos demo sem snapshot |
| 2026-05-11 | 0dfd81d1e | fix(admin): ajustar validacao final dos catalogos digitais |
| 2026-05-11 | a9400ae8a | fix(admin): liberar catalogos digitais por funcionalidade |
| 2026-05-11 | 66adb455c | fix(admin): remover trava de email dos catalogos digitais |
| 2026-05-11 | 9204d7b10 | fix(admin): liberar menu de catalogos por funcionalidade |

## Main legacy files

- `components/catalogos-digitais.php`
- `components/catalogos-digitais-list.php`
- `components/catalogos-studio.php`
- `controllers/catalogos-studio-controller.php`
- `assets/js/components/catalogos-studio.js`
- `includes/catalogos-digitais-permissions.php`
- `scripts/sql/2026-05-04-catalogos-digitais-studio-permissoes.sql`
- `scripts/dev/qa_catalogos_digitais*.js`
- `assets/app-store/catalogos-digitais/*`

## Questions to answer before migration

- Does v2 already have any surface for digital catalogs, or is this a new module?
- Which backend/API owns catalog persistence and publication?
- Which assets/materials are data from API versus static legacy files?
- Is PDF generation expected inside v2, through an API bridge, or outside the frontend?
- How does access work: by contract, functionality, local user and menu permission?

## Initial recommendation

Analyze this batch first and split it into implementation slices:

1. Route/menu/access and read-only list.
2. Studio/editor UI and data contract.
3. Products/customer/recalculation behavior.
4. Publication/PDF/materials.
5. Contract/functionality restrictions and tests.
