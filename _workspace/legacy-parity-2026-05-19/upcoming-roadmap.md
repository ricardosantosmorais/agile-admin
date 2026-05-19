# Roadmap - Proximas Frentes de Paridade Legado

Data: 2026-05-19

Base v2: `admin-v2-web` em `1e033d0`

Base legado anterior: `6cb70a741`

Base legado nova analisada: `origin/master` em `55b0c957f`

## Estado dos repos

- `C:/Projetos/admin-v2-web`: limpo em `codex/legacy-parity-next-slice`.
- `C:/Projetos/admin`: `master` local em `6cb70a741`, atras de `origin/master` por 47 commits.
- `C:/Projetos/admin`: `boot.php` esta modificado localmente; nao fazer pull/merge sem alinhamento.
- Leitura do legado nesta rodada deve usar `origin/master` diretamente, sem modificar o worktree.

## Delta novo identificado

Range: `6cb70a741..origin/master`

- Total: 47 commits.
- Sem merge: 34 commits.
- Merges: 13 commits.

Resumo por grupo dos commits sem merge:

| Grupo | Commits | Disposicao |
|---|---:|---|
| `cashback` | 22 | Nova frente grande; exige descoberta/plano proprio |
| `parametros-empresa` | 1 | Migrado no v2 nesta rodada |
| `notificacoes-painel` | 1 | Migrado no v2 nesta rodada |
| `servicos-integracao` | 1 | Provavelmente coberto parcialmente no v2; validar antes de migrar |
| `status-plataforma` | 2 | Parte ja existe no v2; parte e polling/cache legado |
| `infraestrutura-aws` | 4 | Deferred/backend; nao implementar no frontend sem contrato |
| `boot-only/assets` | 3 | Nao aplicavel ao v2 |

## Ordem recomendada

### 1. `configuracoes-parametros-filial-autocomplete`

Status: migrado no v2 nesta rodada.

Commit legado:

- `a3540b52c` - `Adicao de autocomplete para filtro de filial em empresas parametros`

Motivo:

- A tela ja existe no v2.
- A mudanca e pequena e isolada em filtro/listagem.
- O v2 ja possui `LookupSelect`, filtro `kind: 'lookup'`, e lookup `filiais`.
- Nao exige `api-v3` novo.
- Nao exige mexer no legado.

Arquivos v2 provaveis:

- `src/features/parametros/components/parametros-list-page.tsx`
- `src/features/parametros/services/parametros-types.ts`
- `src/features/parametros/services/parametros-client.ts`
- `app/api/configuracoes/parametros/route.ts`
- `src/features/parametros/services/parametros-mappers.test.ts` ou novo teste focado da bridge/cliente
- `docs/35-modulo-configuracoes-clientes.md` ou documento de configuracoes correspondente, se a doc atual cobrir Parametros

Comportamento esperado:

- Filial deixa de ser filtro textual por nome.
- Filtro passa a ser autocomplete de filial.
- A UI guarda `id_filial` e label da filial para resumo.
- A bridge encaminha `id_filial` para `empresas/parametros`.
- Os filtros atuais de ID, chave, descricao, parametros, posicao, permissao e ativo permanecem iguais.

Risco:

- Baixo.
- Principal cuidado: manter resumo de filtro legivel e nao quebrar paginacao/sort.

### 2. `notificacoes-painel-email-cdn`

Status: migrado no v2 nesta rodada.

Commit legado:

- `a91cd19b0` - `Permite upload CDN em notificacoes por email`

Motivo:

- A tela v2 ja existe em `/notificacoes-painel`.
- O v2 ja tem bridge `/api/uploads` e profile `public-cdn-components`.
- A necessidade funcional e clara: e-mail nao deve salvar imagens base64/SVG; deve usar imagem publica em CDN.

Arquivos v2 provaveis:

- `src/features/notificacoes-painel/services/notificacoes-painel-config.tsx`
- `src/features/notificacoes-painel/services/notificacoes-painel-mappers.ts`
- `app/api/notificacoes-painel/route.ts`
- `src/components/ui/rich-text-editor.tsx` somente se for necessario adicionar modo configuravel, sem alterar comportamento global por inercia
- `src/lib/uploads.ts`
- `src/lib/upload-targets.ts`
- testes da feature/bridge de notificacoes

Comportamento esperado:

- Para canal `email` ou `todos`, bloquear imagens base64, SVG e `image/svg+xml`.
- Insercao/upload de imagem em notificacao por e-mail deve usar CDN publico.
- Nao quebrar usos existentes do `RichTextEditor` que ainda aceitam base64 em outros modulos.

Risco:

- Medio.
- O editor compartilhado hoje converte imagens externas para base64; mudar globalmente pode regredir Paginas/Catalogos/Conteudo.
- Preferir configuracao especifica por campo ou callback de upload para notificacoes.

### 3. `servicos-integracao-inativos-detalhes`

Status: validar antes de migrar.

Commit legado:

- `b197672eb` - `Adicao do botao de detalhes para servicos inativos`

Leitura atual:

- O v2 ja possui uma superficie rica de servicos ERP em `app/api/integracao-com-erp/servicos/route.ts`.
- O endpoint v2 ja reconhece `scope=inactive` e tem acoes/detalhes de servico.
- Antes de implementar, verificar na UI se a listagem/modal de inativos ja expõe detalhes.

Possiveis arquivos v2:

- `app/api/integracao-com-erp/servicos/route.ts`
- feature de integracao ERP servicos em `src/features/integracao-com-erp-*`
- testes existentes de servicos ERP

Risco:

- Baixo a medio, mas pode ja estar coberto.
- Nao duplicar tela se o v2 ja tiver o fluxo.

### 4. `status-plataforma-polling-cache`

Status: revisar, mas nao tratar como primeira fatia.

Commits legados:

- `42b949183` - `Reduz polling e barateia rota legada do status`
- `8360d2ca6` - `Reduz polling automatico do status da plataforma`

Leitura atual:

- O v2 ja tem status no topo e rota `/status-plataforma`.
- Parte desses commits e especifica de `assets/js/scripts.js`, `includes/status-plataforma-monitor.php` e cache legado.
- Pode haver ajuste v2-owned apenas se a frequencia de polling do topbar v2 estiver desalinhada.

Antes de implementar:

- Ler a implementacao v2 atual de topbar/status.
- Confirmar intervalo de refresh e trigger manual.
- Nao copiar cache PHP para frontend.

### 5. `infraestrutura-aws`

Status: deferred/backend.

Commits novos:

- `cdca40c64` - `Reduz carga do painel de saude com cache Redis`
- `bc5d0d173` - `Exibe causa EB nos alertas de compute`
- `a6ba8fafc` - `Adiciona recomendacoes ao financeiro AWS`
- parte de `5db0d011e` toca `includes/aws-platform-monitor/snapshot.php`

Decisao:

- Nao implementar no frontend agora.
- Ainda depende de contrato backend/API para saude AWS, financeiro AWS, metricas, logs EB, WAF e recomendacoes.
- Nao assumir que AWS pode rodar em `admin-v2-web`.

### 6. `cashback`

Status: nova frente grande, fora da proxima fatia segura.

Commits sem merge: 22.

Principais superficies:

- Wizard de ativacao Cashback Winthor.
- Dashboard Cashback.
- Campanhas.
- Pedidos Cashback e Pedidos ERP.
- Extrato.
- Merchants/control plane.
- Simulacao.
- Remocao de operacoes.

Evidencia documental no legado:

- `C:/Projetos/admin/docs/apis/cashback-admin-integration.md`

Leitura inicial:

- O v2 hoje tem apenas sinais pontuais de cashback em menu/i18n/pedidos, mas nao a retaguarda Cashback como modulo proprio.
- A integracao legado fala com `Cashback.Api`, tem env vars, autenticacao administrativa, merchant context e endpoints proprios.

Proximo passo correto:

- Abrir descoberta propria `cashback-admin-v2-discovery`.
- Separar control plane Agile Ecommerce de fluxo tenant.
- Confirmar onde o contrato deve viver antes de implementar:
  - app/api no v2 chamando Cashback.Api diretamente; ou
  - backend/API intermediaria aprovada.
- Nao misturar Cashback com a fatia de Parametros.

## Itens nao aplicaveis ao v2

- `b547a9b47` - `Permite sobrescrever URL Agile no Admin`: altera `boot.php`.
- `443a86ecf` - incremento de assets.
- `49d7e9065` - incremento de assets cashback.

## Guardrails para as proximas fases

- `C:/Projetos/admin` deve permanecer read-only.
- Nao fazer pull/merge no legado enquanto `boot.php` estiver modificado localmente sem autorizacao.
- Nao tocar em `api-v3` sem aprovacao explicita.
- Nao iniciar AWS no frontend sem contrato backend existente.
- Para cada fatia:
  - comparar commit legado especifico;
  - confirmar superficie v2 existente;
  - manter escopo pequeno;
  - adicionar teste focado quando tecnicamente viavel;
  - atualizar docs da feature se o comportamento mudar.
