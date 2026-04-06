# AGENTS.md

## 1) Proposito

Este arquivo define os acordos de trabalho para agentes Codex neste repositorio.

O `admin-v2-web` e o frontend moderno do novo Admin v2. Ele substitui gradualmente partes do legado em `C:\Projetos\admin`, mantendo a mesma base de produto, mas com outra arquitetura:
- Next.js App Router;
- bridges em `app/api/*`;
- autenticacao, tenant e sessao tratados no frontend;
- i18n local;
- componentes compartilhados para listagens, formularios, modais e feedback.

## 2) Fonte de verdade (leitura obrigatoria no inicio de cada tarefa)

Ler nesta ordem:

1. `docs/README.md`
2. `docs/adr/README.md`
3. `docs/12-catalogo-componentes-compartilhados.md`
4. Documentos de modulo relevantes em `docs/`

Documento operacional adicional:
- `AGENTS.md`

Para tarefas de migracao do legado:
- consultar tambem `C:\Projetos\admin\docs`
- e analisar a implementacao real em `C:\Projetos\admin` antes de decidir estrutura ou comportamento

Se a tarefa tocar autenticacao, sessao, tenant, acesso ou expiracao:
- ler `docs/03-autenticacao-sessao-multiempresa.md`
- ler `docs/04-acesso-menu-navegacao.md`
- ler `docs/adr/ADR-003-sessao-expiracao-multiabas.md`

Se a tarefa tocar arquitetura ou padroes:
- ler `docs/05-arquitetura-frontend-padroes.md`
- ler `docs/adr/ADR-005-bases-compartilhadas-crud.md`

## 3) Procedimento padrao (golden workflow)

- Localizar de 1 a 3 exemplos similares no proprio v2 antes de implementar.
- Quando a tarefa for migracao, comparar sempre com o legado:
  - listagem;
  - formulario;
  - controller;
  - modais;
  - regras de permissao;
  - validacoes e payloads.
- Reaproveitar padroes existentes. Nao introduzir nova base sem necessidade real.
- Funcoes genericas de mascara, formatacao, normalizacao, parsing e utilitarios de exibicao nao devem ficar declaradas dentro de telas, tabs, pages ou configs quando puderem ser compartilhadas. Antes de criar helper local, verificar `src/lib/*`, `src/components/*` e services compartilhados existentes.
- Se um helper deixar de ser especifico de um unico modulo, extrair para o local compartilhado adequado e substituir as duplicacoes encontradas na mesma tarefa.
- Manter mudancas pequenas, coesas e delimitadas por modulo ou infraestrutura.
- Se a tarefa for grande, propor primeiro um plano curto com passos e arquivos.
- Validacoes devem seguir cadencia pragmatica para evitar custo e latencia desnecessarios:
  - durante exploracao, leitura de legado, analise, debugging inicial ou alinhamento de abordagem, nao rodar `lint` ou `build` por padrao;
  - em ajustes pequenos e localizados, validar apenas no fechamento do bloco de alteracao, preferindo a menor validacao suficiente;
  - `lint` deve ser executado no fechamento da tarefa ou do bloco principal de mudancas, nao a cada interacao;
  - `build` deve ser executado apenas quando a natureza da mudanca justificar, por exemplo alteracoes estruturais, rotas, bundling, SSR, providers, i18n ampla ou risco real de integracao;
  - evitar rerodar a mesma validacao duas ou mais vezes na mesma interacao sem que uma nova alteracao relevante tenha invalidado o resultado anterior.
- Toda feature nova deve nascer com cobertura minima de testes:
  - testes unitarios para mapeadores, validadores, helpers e regras de transformacao;
  - testes de integracao de componente quando houver comportamento de UI relevante;
  - teste E2E do fluxo principal da feature.
- Se a tela de edicao tiver abas, validar explicitamente o carregamento de cada aba ao menos ate o estado de sucesso ou vazio, para garantir que nenhuma aba quebra ao abrir por erro de bridge, contrato ou permissao.
- Se um teste relevante falhar por limitacao do sandbox local da ferramenta, por exemplo `spawn EPERM` ao executar `vitest`, `vite`, `esbuild` ou Playwright, rerodar a validacao fora do sandbox na mesma tarefa. Nao tratar esse tipo de falha como impeditivo funcional sem antes validar fora do sandbox.
- Se a infraestrutura de testes ainda nao existir para um ponto especifico, isso deve ser declarado explicitamente e o gap deve entrar na documentacao tecnica ou no backlog da feature.
- Atualizar a documentacao em `docs/` quando houver mudanca real de comportamento, padrao, arquitetura ou fluxo.
- Toda string nova visivel ao usuario deve entrar no i18n. Nao deixar texto hardcoded quando a tela ja usa traducao.
- Todo texto em portugues deve usar portugues do Brasil, com acentuacao e pontuacao corretas.
- Ao criar ou ajustar rotas protegidas, considerar tambem:
  - sessao;
  - tenant;
  - expiracao;
  - comportamento multiabas.
- Antes de concluir uma migracao, verificar se a tela esta aderente ao padrao atual do v2:
  - breadcrumb;
  - toolbar;
  - filtros;
  - listagem;
  - formularios;
  - modais;
  - mensagens e toasts;
  - i18n;
  - responsividade.

## 4) Regras especificas do v2

### 4.1 Arquitetura frontend

- O projeto usa `Next.js` com `App Router`.
- Respeitar boundaries entre `client` e `server`.
- Nao chamar funcoes client-side a partir de paginas server-side.
- Quando uma tela precisar de comportamento client-side, explicitar isso corretamente.

### 4.2 Bridges e backend

- Toda integracao com a `api-v3` deve passar preferencialmente por `app/api/*`.
- Nao espalhar chamadas diretas para a `api-v3` pela UI quando ja houver bridge ou quando a bridge for o lugar correto.
- Adaptacoes de payload, normalizacao e contratos devem viver em:
  - clients da feature;
  - mapeadores da feature;
  - route handlers do app;
  - nunca de forma improvisada na UI.
- Se a API real existir, nao manter dado fake para o modulo.

### 4.3 CRUDs e composicao

- Nem toda tela deve usar `CrudFormPage` ou `CrudListPage`.
- Usar a hierarquia atual:
  1. `CrudFormPage` / `CrudListPage` para CRUDs lineares;
  2. bases especializadas para catalogo e listagem;
  3. paginas proprias para modulos operacionais densos.
- Antes de criar uma tela manual, verificar se:
  - `CrudFormPage`;
  - `CrudFormSections`;
  - `useCrudListController`;
  - `AppDataTable`;
  - `TabbedCatalogFormPage`
  ja resolvem o problema.
- Antes de forcar uma tela em base generica, verificar se isso nao vai esconder regra de negocio real.

### 4.4 Formularios

- Formularios novos devem seguir o padrao visual atual do v2:
  - `PageHeader` consistente;
  - `SectionCard`;
  - `FormRow` quando o layout for em linha;
  - `Salvar` no topo quando o rodape nao estiver visivel;
  - toasts para erro e feedback;
  - mascaras aplicadas tambem no carregamento, nao apenas na digitacao.
- Campos booleanos devem preferir os componentes atuais, nao checkbox cru, quando a tela ja estiver no novo padrao.
- Campos de imagem devem usar o componente compartilhado de upload.
- Campos HTML devem usar o editor compartilhado.

### 4.5 Listagens

- Toda listagem nova deve seguir o padrao global do v2:
  - breadcrumb no topo;
  - `Atualizar` no `PageHeader`;
  - card principal de listagem;
  - botao `Filtros` no lado esquerdo do cabecalho do card;
  - botao `Novo` no lado direito;
  - filtros ocultos por padrao;
  - `AppDataTable` como base.
- Colunas devem ser definidas com responsabilidade clara:
  - label;
  - filtro;
  - ordenacao;
  - renderizacao responsiva.
- Nao deixar textos quebrados, truncados ou com codificacao corrompida na tabela.

### 4.6 I18n

- Toda string nova de UI deve ser adicionada aos dicionarios:
  - `src/i18n/dictionaries/pt-BR.ts`
  - `src/i18n/dictionaries/en-US.ts`
- Nao usar fallback hardcoded em portugues em telas que precisam alternar idioma.
- Menus dinamicos devem usar chave estavel e fallback controlado.
- Sempre revisar se a alteracao introduziu:
  - chave literal aparecendo na tela;
  - ingles misturado com portugues;
  - texto com codificacao quebrada.
- Nao deixar mojibake ou texto corrompido em labels, tabelas, menus, docs ou dicionarios.
  Corrigir na origem qualquer ocorrencia de caracteres quebrados, substituicao por `?` ou sequencias tipicas de encoding incorreto antes de concluir a tarefa.
- Sempre que houver alteracao em i18n, docs, labels, menus ou qualquer arquivo textual visivel ao usuario, validar explicitamente se o arquivo permaneceu em encoding correto e se os acentos renderizam corretamente.
- Se uma mudanca introduzir ou revelar problema de codificacao, corrigir o arquivo afetado na mesma tarefa; nao deixar vestigio para ajuste futuro.

### 4.7 Sessao, logout e expiracao

- Nao redirecionar silenciosamente para login quando a sessao expirar.
- Seguir o fluxo atual do v2:
  - aviso de expiracao;
  - opcao de continuar sessao;
  - modal bloqueante de sessao encerrada;
  - sincronizacao entre abas.
- Ao mexer em logout ou autenticacao, limpar estado sensivel local.
- Qualquer mudanca nessa area exige revisar:
  - `auth-context`;
  - `session-lifecycle-context`;
  - guards;
  - multiabas;
  - tenant atual.

### 4.8 Migracao do legado

- O objetivo nao e copiar o legado literalmente.
- O objetivo e trazer:
  - regra de negocio;
  - fluxo operacional;
  - comportamento funcional;
  - sem reproduzir o acoplamento estrutural antigo.
- Quando migrar uma tela, verificar:
  - se o legado tinha aba, modal, dual list, treeview ou detalhe expansivel;
  - se existe tela auxiliar de senha, logs ou relacao vinculada;
  - se a permissao vem do menu, do boot ou de regras operacionais especificas.

### 4.9 Testes

- Toda feature nova deve incluir testes unitarios e E2E.
- Minimo esperado por feature:
  - unitario para mapeadores, normalizadores, validadores ou services da feature;
  - integracao de componente para comportamento critico de formulario, tabela ou modal, quando aplicavel;
  - E2E do fluxo feliz principal.
- Ao corrigir bug real, adicionar teste que cubra o caso corrigido sempre que tecnicamente viavel.
- Nao considerar a feature fechada se a tela entrou sem plano de cobertura.

### 4.10 Acessibilidade

- Formularios devem manter labels claras, foco visivel e navegacao por teclado.
- Modais devem bloquear interacao com o fundo, manter foco dentro do contexto e permitir leitura clara do conteudo.
- Componentes clicaveis nao devem depender apenas de icone ou cor para comunicar estado.
- Sempre que possivel, usar semantica HTML correta antes de recorrer a atributos ARIA manuais.

### 4.11 Performance e payload

- Evitar carregar dados excessivos na listagem quando a tela e server-side por definicao.
- Nao enviar no payload campos que nao pertencem ao contrato de escrita.
- Ao adicionar lookups, tabelas relacionais ou modais, revisar:
  - necessidade real de embed;
  - volume de dados trafegado;
  - possibilidade de lazy load.

### 4.12 Observabilidade e erros

- Erros visiveis ao usuario devem seguir o padrao atual do v2, preferencialmente com `PageToast`, `AsyncState` ou modal apropriado.
- Nao deixar erro cru de backend aparecer sem contexto, quando houver ponto de traducao ou adaptacao conhecido.
- Sempre que um fluxo falhar por contrato de API, tentar registrar esse ajuste na bridge, no mapper ou no client da feature, nao espalhar tratamento pontual na UI.

### 4.13 Documentacao por feature

- Feature nova deve atualizar pelo menos um destes pontos quando aplicavel:
  - cobertura atual em `docs/06-modulos-e-cobertura-atual.md`;
  - documento de modulo proprio em `docs/`;
  - ADR, se a feature introduzir decisao arquitetural nova;
  - catalogo de componentes, se um componente compartilhado novo for criado.

### 4.14 Regressao visual

- Toda alteracao visual ou de fluxo de tela deve ser validada em:
  - portugues;
  - ingles;
  - desktop;
  - mobile.
- Nao considerar uma tela visualmente validada se ela so foi conferida em um idioma ou em um breakpoint.

### 4.15 Checklist de revisao antes de concluir

- verificar i18n em PT e EN;
- verificar se nao houve regressao de encoding nos arquivos alterados, especialmente dicionarios, docs, menus e labels;
- verificar responsividade basica;
- verificar estados de loading, vazio e erro;
- verificar permissao de listar, criar, editar e excluir quando houver;
- verificar se breadcrumb, toolbar, filtros, tabela e formulario seguem o padrao atual;
- verificar regressao visual em PT e EN, desktop e mobile;
- verificar se nao ha texto truncado, codificacao quebrada ou chave literal na tela.

## 5) Guardrails de qualidade e seguranca

- Nao expor segredos, tokens, credenciais ou dados sensiveis em codigo, logs ou docs.
- Evitar log de PII.
- Nao adicionar dependencia nova sem justificativa tecnica clara.
- Antes de persistir upload, autenticacao ou sessao, considerar o desenho futuro com backend real.
- Nao quebrar contratos publicos ou rotas ja usadas no v2 sem ajustar a documentacao correspondente.
- Quando houver incerteza de regra de negocio, declarar explicitamente e verificar no legado ou na API antes de concluir.

## 6) Definition of Done (DoD) minimo

- Implementacao segue os padroes do repositorio.
- `lint` foi executado.
- `build` foi executado quando a mudanca justificar.
- Testes unitarios e E2E da feature foram criados ou atualizados, ou a ausencia foi declarada com motivo tecnico real.
- Fluxo principal da tela ou componente foi validado no contexto correto.
- Strings novas foram traduzidas.
- Documentacao em `docs/` foi atualizada quando houve mudanca de comportamento, arquitetura ou padrao.
- O resultado ficou consistente com o legado quando a tarefa for migracao.

## 7) Branching e integracao

- Nunca enviar alteracoes direto para `master`, salvo orientacao explicita do programador.
- Se estiver em `master`, criar branch antes de seguir.
- Para novas branches, usar prefixo `codex/`.
- Se a tarefa exigir sincronizacao com a `master`, atualizar a branch local corretamente antes de abrir PR.

## 8) Escopo e overrides

- Este arquivo vale como baseline para o repositorio inteiro.
- Pode haver `AGENTS.md` ou `AGENTS.override.md` em subpastas com regras adicionais.
- Instrucoes mais especificas vencem as mais gerais.
- Se existir `AGENTS.override.md` na raiz, ele pode sobrepor este arquivo no escopo correspondente.
