# Design System Técnico - Admin v2 Web

## Overview

O design do Admin v2 é uma interface operacional B2B com aparência de painel moderno, denso e escaneável. A base visual combina um canvas claro levemente aquecido, superfícies brancas translúcidas, bordas bege/cinzas discretas e ações primárias em slate escuro. No dark mode, o sistema troca para um canvas frio em azul/slate, com cartões em camadas azuladas e ação primária em gradiente azul/teal.

A fonte de verdade atual é [src/index.css](../src/index.css). No checkout atual não há `index.scss` em `admin-v2-web`; se um SCSS for reintroduzido, ele deve derivar destes tokens ou substituir esta fonte de verdade de forma explícita. Não manter dois sistemas visuais paralelos.

O sistema não é uma estética de marketing. Ele é feito para operação repetida: listas, formulários, filtros, modais, permissões, multiempresa, i18n e migração gradual do legado.

**Características principais:**
- Canvas com duas polaridades: light quente para operação padrão e dark frio para leitura prolongada em ambientes de baixa luz.
- Densidade controlada: texto pequeno em tabelas e metadados, ações compactas, cartões com padding moderado.
- Componentes canônicos por função: `PageHeader`, `SectionCard`, `AppDataTable`, `DataTableFiltersCard`, `CrudListPage`, `CrudFormPage`, `FormRow`, `LookupSelect`, `PageToast` e `AsyncState`.
- Ações primárias fortes e raras: `app-button-primary` deve representar o comando principal da área.
- Bordas e superfícies semânticas via `--app-*`, evitando cores soltas em telas novas.
- Dark mode por token e por override global, não por reimplementação local de cada tela.

## Fontes de Verdade

- [src/index.css](../src/index.css): tokens globais, superfícies, botões, badges, dark mode e classes semânticas.
- [src/contexts/ui-context.tsx](../src/contexts/ui-context.tsx): persistência do tema e aplicação de `html[data-theme='dark']`.
- [src/components/ui/input-styles.ts](../src/components/ui/input-styles.ts): contrato visual de inputs.
- [src/components/ui/section-card.tsx](../src/components/ui/section-card.tsx): card base.
- [src/components/data-table/app-data-table.tsx](../src/components/data-table/app-data-table.tsx): tabela desktop/mobile.
- [src/components/data-table/data-table-toolbar.tsx](../src/components/data-table/data-table-toolbar.tsx): ações de listagem.
- [src/components/data-table/data-table-filters.tsx](../src/components/data-table/data-table-filters.tsx): filtros.
- [src/layouts/auth-shell.tsx](../src/layouts/auth-shell.tsx): shell autenticada.
- [src/components/shell/sidebar.tsx](../src/components/shell/sidebar.tsx) e [src/components/shell/topbar.tsx](../src/components/shell/topbar.tsx): navegação.

## Tokens

### Tailwind Theme

| Token | Valor | Uso |
|---|---:|---|
| `--color-surface` | `#f6f3ea` | superfície base clara e backgrounds utilitários |
| `--color-accent` | `#195f4d` | acento institucional em navegação e pills |
| `--color-accentSoft` | `#dff4eb` | acento suave |
| `--color-line` | `#ddd6c7` | linhas e divisórias |
| `--color-panel` | `#fffdf8` | painel claro |
| `--shadow-panel` | `0 18px 50px rgba(15, 23, 42, 0.08)` | sombra ampla de painel |
| `--font-sans` | `"Manrope", system-ui, sans-serif` | fonte padrão |

### Light Mode

| Token | Valor | Uso |
|---|---:|---|
| `--app-bg` | gradiente radial + linear | canvas geral da aplicação |
| `--app-text` | `#1f2937` | texto principal |
| `--app-muted` | `#475569` | texto secundário |
| `--app-panel` | `rgba(255, 255, 255, 0.82)` | painel translúcido |
| `--app-panel-solid` | `#ffffff` | cartões, tabelas e controles sólidos |
| `--app-surface` | `#f8f5ee` | superfície clara alternativa |
| `--app-border` | `rgba(221, 214, 199, 0.9)` | borda geral |
| `--app-card-border` | `#e4ddd0` | borda de card |
| `--app-card-shadow` | `0 18px 42px rgba(15, 23, 42, 0.08)` | card principal |
| `--app-card-shadow-soft` | `0 12px 28px rgba(15, 23, 42, 0.055)` | card interno/tabela |
| `--app-soft-tint` | `#f7f2e8` | painel suave |
| `--app-accent-tint` | `#e8f4ef` | painel de acento |
| `--app-control-border` | `#ddd5c7` | borda de input/controle |
| `--app-control-border-strong` | `#c1b39a` | foco/ênfase de controle |
| `--app-control-muted-bg` | `#f8f3ea` | controle secundário |
| `--app-hover-surface` | `#f7f3eb` | hover em linhas e navegação |
| `--app-focus-ring` | `rgba(239, 231, 215, 0.95)` | foco em campos |

### Dark Mode

| Token | Valor | Uso |
|---|---:|---|
| `--app-bg` | gradiente radial + `#020617`/`#0f172a`/`#111827` | canvas escuro |
| `--app-text` | `#e5eef8` | texto principal |
| `--app-muted` | `#cbd5e1` | texto secundário |
| `--app-panel` | `rgba(15, 23, 42, 0.78)` | painel translúcido |
| `--app-panel-solid` | `#0f172a` | cartões sólidos |
| `--app-surface` | `#111c2f` | superfície interna |
| `--app-border` | `rgba(71, 85, 105, 0.46)` | borda geral |
| `--app-card-border` | `rgba(71, 85, 105, 0.68)` | borda de card |
| `--app-control-border` | `rgba(71, 85, 105, 0.88)` | borda de controle |
| `--app-control-muted-bg` | `#162033` | controle secundário |
| `--app-hover-surface` | `#162033` | hover |
| `--app-focus-ring` | `rgba(25, 95, 77, 0.28)` | foco |

## Cores Semânticas

### Ações

| Classe | Light | Dark | Uso |
|---|---|---|---|
| `app-button-primary` | gradiente `#0f172a` → `#1f2937`, texto branco | gradiente `#1d4ed8` → `#0f766e`, texto branco | ação principal |
| `app-button-secondary` | fundo `--app-button-secondary-bg`, borda semântica | fundo `#132033`, borda slate | ações auxiliares |
| `app-button-danger` | `#fff1f2`, texto `#be123c`, borda `#fecdd3` | rose translúcido, texto `#f9a8b4` | ação destrutiva |

### Feedback e status

| Classe | Uso |
|---|---|
| `app-badge-success` | ativo, sim, sucesso, crescimento positivo |
| `app-badge-warning` | atenção, pendente, não ideal |
| `app-badge-danger` | erro, bloqueado, ação destrutiva |
| `app-badge-neutral` | neutro, desconhecido, sem estado forte |
| `app-badge-info` | informativo, metadado ou destaque frio |
| `app-error-panel` | erro contextual em bloco |
| `app-warning-panel` | aviso contextual em bloco |
| `PageToast` com `tone="success"` ou `tone="error"` | feedback temporário global da página |

## Tipografia

O sistema usa `Manrope` como fonte principal, com `system-ui` como fallback. A hierarquia é funcional e compacta; não há display font separado.

| Papel | Classe/valor típico | Peso | Uso |
|---|---|---:|---|
| Shell/nav item | `text-[15px] leading-6` | `600` | itens principais da sidebar |
| Breadcrumb | `text-[13px] leading-5` | `500/600` | `PageHeader` |
| Card title | `text-base` | `700` | título de `SectionCard` |
| Card description | `text-[11px] leading-5` | `400/500` | descrição curta em card |
| Body UI | `text-sm` ou `text-[15px]` | `400/500` | campos, linhas, labels |
| Form label | `text-[13px]` | `500` | `FormRow` |
| Button label | `text-sm` | `600/700` | ações de toolbar e formulário |
| Table header | `text-sm` ou `text-xs uppercase` | `700/900` | cabeçalho de tabela |
| Badge | `text-xs` | `700` | `StatusBadge` |
| Micro label | `text-[10px] uppercase tracking-[0.22em]` | `600` | métricas e indicadores |
| Rich text | `text-[15px] leading-8` | variável | conteúdo editável |

Princípios:
- Não usar tipografia hero em telas operacionais.
- Em painel denso, títulos devem ser menores e mais informativos.
- `tracking` forte fica restrito a micro labels, métricas e cabeçalhos técnicos.
- Texto visível novo deve passar pelo i18n quando a tela já usa tradução.

## Layout

### Shell

`AuthShell` define o frame operacional:
- padding externo `p-3` no mobile/tablet e `lg:p-4` no desktop;
- container máximo `max-w-[1580px]`;
- gap principal `gap-4`;
- `Sidebar` lateral fixa no desktop;
- `Topbar` acima do conteúdo;
- conteúdo em `main` com `gap-3`.

### Espaçamento

O projeto usa Tailwind como escala prática:
- `gap-2`/`gap-3`: grupos pequenos e botões;
- `gap-4`/`gap-5`: separação entre blocos de página;
- `px-3.5 py-2.5`: campos e botões compactos;
- `px-5 py-5` e `md:px-6 md:py-6`: `SectionCard`;
- `p-4`/`p-5`: painéis internos e modais menores.

### Grids

Padrões recorrentes:
- `md:grid-cols-[180px_minmax(0,1fr)]` em `FormRow`;
- `sm:grid-cols-2` para ranges e pares de campo;
- `md:grid-cols-2`, `xl:grid-cols-3` e `xl:grid-cols-4` para cards operacionais;
- `xl:grid-cols-[320px_minmax(0,1fr)]` ou variantes em telas densas.

Não inventar grade fixa global. A grade deve seguir o fluxo operacional da tela.

## Elevação e Profundidade

| Nível | Tratamento | Uso |
|---|---|---|
| 0 | canvas `--app-bg` | fundo da aplicação |
| 1 | `app-pane` ou `app-control-muted` sem sombra forte | blocos internos e estados vazios |
| 2 | `app-card-modern` com `--app-card-shadow-soft` | cards de seção e blocos de formulário |
| 3 | `app-shell-card-modern` com `--app-card-shadow` | header, topbar, sidebar e modal principal |
| 4 | sombra explícita `0_32px_90px_rgba(...)` | `OverlayModal` e overlays críticos |

Profundidade vem de borda, gradiente sutil e sombra leve. Não usar sombra pesada para diferenciar cada item de lista.

## Formas

| Forma | Valor típico | Uso |
|---|---:|---|
| Controle pequeno | `rounded-[0.8rem]` a `rounded-[0.95rem]` | botões internos, inputs, toolbar |
| Card interno | `rounded-[1rem]` a `rounded-[1.15rem]` | campos compostos e painéis |
| Section card | `rounded-[1.1rem]` | `SectionCard` |
| Tabela | `rounded-[1.25rem]` | `AppDataTable` desktop |
| Header | `rounded-[1.45rem]` | `PageHeader` |
| Modal | `rounded-[1.6rem]` | `OverlayModal` |
| Pill/circular | `rounded-full` | botões de ação, badges, tabs e chips |

Cards não devem ser aninhados visualmente sem necessidade. Use `app-pane`/`app-pane-muted` dentro de `SectionCard` para subáreas.

## Componentes

### `PageHeader`

- Superfície: `app-shell-card-modern`.
- Raio: `rounded-[1.45rem]`.
- Padding: `px-5 py-1.5 md:px-6`.
- Conteúdo: breadcrumb flexível e ações à direita.
- Regra: em listagens, o breadcrumb substitui título duplicado no corpo.

### `SectionCard`

- Superfície: `app-card-modern`.
- Raio: `rounded-[1.1rem]`.
- Padding: `px-5 py-5 md:px-6 md:py-6`.
- Título: `text-base font-bold`.
- Descrição: `text-[11px] leading-5`.
- Uso: formulário, bloco operacional e card de listagem.

### `AppDataTable`

- Desktop: tabela em `app-table-shell`, `table-fixed`, scroll horizontal.
- Mobile: cards `app-card-modern`.
- Ações: ícones em botões circulares `h-9 w-9`, com tooltip e `aria-label`.
- Coluna de ações: sticky à direita, largura calculada por quantidade máxima de ações.
- Estados: vazio em `app-pane-muted` com borda tracejada.
- Regra: esconder colunas menos importantes por breakpoint, não esmagar conteúdo.

### `DataTableFiltersCard`

- Filtros recolhidos por padrão.
- Variante `embedded` desaparece quando recolhida.
- Campos usam `inputClasses()`, `LookupSelect`, `DateInput` e `InputWithAffix`.
- Resumo mostra filtros aplicados quando a variante não é embutida.
- Regra: filtro relacional do legado deve continuar relacional no v2.

### `DataTableToolbar`

- Botões `h-11`, `rounded-full`, `px-4`, `text-sm font-semibold`.
- `Novo` costuma ser `primary`.
- `Filtros` e `Atualizar` costumam ser `secondary`.
- Ações destrutivas usam `danger`.

### `FormRow`

- Grid desktop: `md:grid-cols-[180px_minmax(0,1fr)]`.
- Label: `text-[13px] font-medium`.
- Helper: `text-xs text-slate-500`.
- Required: asterisco rose.
- Uso: formulários operacionais lineares e híbridos.

### Inputs

`inputClasses()` é o contrato padrão:
- superfície `app-control`;
- raio `rounded-[0.95rem]`;
- padding `px-3.5 py-2.5`;
- texto `text-sm`;
- foco `focus:border-[color:var(--app-control-border-strong)]` e `focus:ring-4 focus:ring-[color:var(--app-focus-ring)]`.

Não criar input local com borda/foco próprios sem motivo forte.

### `LookupSelect`

- Controle principal `app-control`, `rounded-[1rem]`, `px-3.5 py-3`.
- Dropdown `app-table-shell`, `fixed`, `z-[240]`, `rounded-[1.2rem]`.
- Campo de busca interno `app-control-muted`.
- Opções com hover em `--app-hover-surface`.
- Uso obrigatório para busca por entidade relacionada quando houver API/lookup.

### Booleanos

`BooleanSegmentedField`:
- base `app-control-muted`, `rounded-[1rem]`, padding `p-1`;
- opção positiva ativa em emerald;
- opção negativa ativa em `app-control`.

Em formulários novos, preferir escolha segmentada a checkbox cru quando o campo for decisão explícita `Sim/Não`.

### `StatusBadge`

- Base `app-badge`, `rounded-full`, `px-3 py-1`, `text-xs font-bold`.
- Tons: `success`, `warning`, `danger`, `neutral`, `info`.
- Não usar badge para CTA.

### `PageToast`

- Posição fixa: topo, centralizado, `z-[160]`.
- Largura máxima: `max-w-3xl`.
- Raio: `rounded-[1.1rem]`.
- Duração padrão: `4500ms`.
- Tons: `success` e `error`.

### `OverlayModal`

- Superfície: `app-shell-card-modern`.
- Raio: `rounded-[1.6rem]`.
- Altura máxima: `max-h-[calc(100vh-2rem)]`.
- Sombra: `0_32px_90px_rgba(15,23,42,0.28)`.
- Deve bloquear scroll do fundo e manter scroll interno.

### `TabButton`

- Base pill com `rounded-full`, `px-4 py-2.5`, `text-sm font-semibold`.
- Inativo: `app-pill-tab`.
- Ativo: `app-pill-tab-active`.
- Usar para seções independentes; não criar abas em fluxo linear.

### `StatCard`

- Superfície: `app-stat-card`.
- Raio: `rounded-[1.3rem]`.
- Acento superior por tom: emerald, sky, amber, rose.
- Micro label: uppercase com tracking forte.
- Valor: `text-[1.7rem] font-black`.
- Uso: dashboards e indicadores, com tooltip simples quando necessário.

## Navegação

### Sidebar

- Logo grande quando expandida, pequeno quando colapsada.
- Itens principais: `rounded-2xl`, `text-[15px] font-semibold`.
- Item ativo: `app-nav-active`.
- Grupo ativo: `app-nav-group-active`.
- Subitem ativo: `app-nav-child-active`.
- Mobile: drawer com bloqueio de scroll e botão de fechar.

### Topbar

- Ações globais em botões quadrados arredondados `h-10 w-10 rounded-2xl`.
- Painéis globais: busca, tenant, histórico, notificações, status de plataforma e usuário.
- Quick access deve preservar legibilidade e fechar ao clicar fora.
- Theme toggle altera `html[data-theme]` via `UiProvider`.

## Responsividade

Breakpoints observados seguem Tailwind:
- `sm`: pares de campos, date ranges e colunas simples.
- `md`: alterna tabela/card, `FormRow` em duas colunas e cards 2-up.
- `lg`: shell desktop e sidebar fixa.
- `xl`: painéis densos, três colunas e layouts com coluna lateral.
- `2xl`: colunas pouco importantes e telas muito largas.

Regras:
- Tabela vira cards no mobile quando usar `AppDataTable`.
- Ações devem manter largura estável.
- Texto em botão deve quebrar sem sobrepor ícone ou borda.
- Modais devem caber em `100vh` com scroll interno.
- No mobile, prioridade é fluxo principal, não paridade pixel a pixel com desktop.

## Estados

| Estado | Tratamento |
|---|---|
| Default | superfície semântica e texto `--app-text` |
| Hover | `--app-hover-surface`, elevação leve em botões |
| Focus | `--app-focus-ring`, borda forte de controle |
| Disabled | opacidade reduzida, cursor `not-allowed`, sem perda completa de contraste |
| Loading | `AsyncState` com skeleton `app-pane-muted animate-pulse` |
| Empty | bloco tracejado em `app-pane-muted` |
| Error | `AsyncState`, `PageToast`, `app-error-panel` ou mensagem contextual |
| Success | `PageToast`, `StatusBadge success` ou feedback local |
| Expanded | `app-table-row-expanded` |

## Do's and Don'ts

### Do

- Use `--app-*` e classes `app-*` antes de escrever cor literal.
- Use `PageHeader` em telas autenticadas.
- Use `SectionCard` como superfície principal de seção.
- Use `AppDataTable` para listagem com volume, paginação, ações e mobile.
- Use `LookupSelect` para filtros/campos relacionais.
- Preserve dark mode ao alterar qualquer classe de superfície.
- Verifique i18n quando adicionar texto visível.
- Corrija mojibake no arquivo tocado.

### Don't

- Não criar paleta nova por módulo.
- Não usar cards dentro de cards quando `app-pane` resolve.
- Não transformar tela operacional em hero/landing.
- Não usar checkbox cru para booleanos novos quando o padrão segmentado couber.
- Não rebaixar autocomplete do legado para input texto por conveniência.
- Não esconder erro de contrato em toast genérico se a bridge/mapper puder normalizar.
- Não remover `use client` por estética em componente que depende de hooks, browser APIs ou clients locais.

## Guia de Iteração

1. Identifique o tipo de tela: CRUD linear, formulário híbrido, tabulada, painel operacional ou ferramenta.
2. Escolha a menor base compartilhada que resolva o fluxo.
3. Consulte `src/index.css` antes de criar token visual.
4. Monte a tela com `PageHeader`, `SectionCard`, estados e i18n.
5. Valide light/dark, desktop/mobile e estados de loading/vazio/erro.
6. Se um padrão novo se repetir em mais de uma feature, extraia componente ou helper compartilhado.
7. Atualize este guia quando a decisão visual passar a orientar mais de um módulo.
