# Batch: produtos-embalagens-edicao

Title: Produtos: edicao de embalagens
Disposition: migrado-v2
Priority: P1
Commit count: 2

## Summary

Normalizar/decodificar o ID real de `produtos_embalagens` antes de editar/salvar/remover embalagem.

Status v2: concluido nesta rodada.

## Current reading

- Recommendation: Segunda fatia pequena.
- Rationale: Ha superficie v2 existente, mas o ajuste legado protege a edicao de embalagens quando o identificador vem composto.
- V2 evidence: packaging rows are encoded in `src/features/produtos/services/produto-relations.ts` and used by `ProdutoEmbalagensTab`.
- Legacy evidence: commit `fbf435419` strips the product/branch suffix before using the embalagem id.
- V2 implementation: `src/features/produtos/services/produto-relations.ts` passou a expor `getProdutoEmbalagemApiId`, que resolve o ID real a partir do ID codificado do v2 (`id|produto|filial`) e do sufixo legado `id_produto + id_filial`.
- Bridge ajustada: `app/api/produtos/[id]/embalagens/route.ts` usa o ID real no `POST` e no `DELETE`, preservando o contrato atual da UI e sem alterar outras relacoes de produto.
- Teste focado: `src/features/produtos/services/produto-relations.test.ts`.
- Validacao executada: `.\npxw.cmd vitest run src/features/produtos/services/produto-relations.test.ts --configLoader native` (3 testes passando).
- Validacao visual comparativa: pendente por depender de sessao/dados operacionais de Produtos; a fatia foi validada no contrato que reproduz a causa do ajuste legado.

## Commits

| Data | Commit | Assunto | Disposicao | Arquivos |
|---|---|---|---|---:|
| 2026-05-13 | `3110ae638` | Merge pull request #736 from agileecommerce/fix-produtos-embalagens | migrado-v2 | 0 |
| 2026-05-13 | `fbf435419` | Ajuste de formulário para edição de embalagens do produto | migrado-v2 | 1 |

## Legacy files touched

- `components/produtos-embalagens-form.php`
