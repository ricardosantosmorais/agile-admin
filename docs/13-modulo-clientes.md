# 13 - Modulo Clientes

## Objetivo

`Clientes` e o modulo de referencia do `admin-v2-web` para formularios operacionais densos.

Ele nao e um CRUD simples. O modulo concentra:

- listagem server-side com varias acoes operacionais;
- formulario com abas;
- relacoes com outras entidades;
- modais auxiliares;
- regras de permissao;
- validacao e normalizacao de payload.

Por isso, `Clientes` foi usado como base de decisao para boa parte da arquitetura atual do v2.

## Estrutura da feature

Arquivos principais:

- [clientes-list-page.tsx](../src/features/clientes/components/clientes-list-page.tsx)
- [cliente-form-page.tsx](../src/features/clientes/components/cliente-form-page.tsx)
- [use-clientes-list-controller.ts](../src/features/clientes/hooks/use-clientes-list-controller.ts)
- [clientes-list.ts](../src/features/clientes/services/clientes-list.ts)
- [cliente-form.ts](../src/features/clientes/services/cliente-form.ts)
- [clientes-mappers.ts](../src/features/clientes/services/clientes-mappers.ts)
- [clientes.ts](../src/features/clientes/types/clientes.ts)

Subcomponentes importantes:

- [cliente-geral-tab.tsx](../src/features/clientes/components/cliente-geral-tab.tsx)
- [cliente-classificacao-tab.tsx](../src/features/clientes/components/cliente-classificacao-tab.tsx)
- [cliente-filiais-tab.tsx](../src/features/clientes/components/cliente-filiais-tab.tsx)
- [cliente-vendedores-tab.tsx](../src/features/clientes/components/cliente-vendedores-tab.tsx)
- [cliente-formas-tab.tsx](../src/features/clientes/components/cliente-formas-tab.tsx)
- [cliente-condicoes-tab.tsx](../src/features/clientes/components/cliente-condicoes-tab.tsx)
- [cliente-adicionais-tab.tsx](../src/features/clientes/components/cliente-adicionais-tab.tsx)

Modais da listagem:

- [client-linked-users-modal.tsx](../src/features/clientes/components/client-linked-users-modal.tsx)
- [client-linked-sellers-modal.tsx](../src/features/clientes/components/client-linked-sellers-modal.tsx)
- [client-unlock-modal.tsx](../src/features/clientes/components/client-unlock-modal.tsx)

## Papel arquitetural do modulo

`Clientes` nao usa `CrudFormPage` nem `CrudListPage` como composicao final.

Motivo:

- a listagem tem varias acoes por linha;
- o formulario tem multiplas abas com comportamentos diferentes;
- algumas abas sao donas de relacoes completas, com inclusao, exclusao e refresh do registro;
- o modulo concentra mais regra operacional do que um CRUD linear.

Mesmo assim, o modulo usa infraestrutura compartilhada do v2:

- `PageHeader`;
- `SectionCard`;
- `AppDataTable`;
- `ConfirmDialog`;
- `PageToast`;
- `AsyncState`;
- `useFormState`;
- `useFooterActionsVisibility`.

Ou seja, a regra da feature continua local, mas a infraestrutura visual e de fluxo e compartilhada.

## Listagem

### Composicao

A listagem principal esta em [clientes-list-page.tsx](../src/features/clientes/components/clientes-list-page.tsx).

Ela usa:

- `PageHeader` com breadcrumb e `Atualizar`;
- `SectionCard` como surface principal;
- `DataTableFilterToggleAction` no lado esquerdo do cabecalho do card;
- `DataTablePageActions` no lado direito;
- `DataTableFiltersCard` com filtros ocultos por padrao;
- `AppDataTable` para renderizacao da grade.

### Controller da listagem

O estado da listagem foi movido para [use-clientes-list-controller.ts](../src/features/clientes/hooks/use-clientes-list-controller.ts).

Esse controller centraliza:

- filtros e draft de filtros;
- expandir/recolher filtros;
- pagina, ordenacao e selecao;
- chamadas server-side;
- modais operacionais;
- confirmacoes de exclusao e desbloqueio.

Esse desenho evita deixar a pagina principal com regra demais.

### Acoes operacionais da listagem

Hoje a listagem suporta:

- editar ou visualizar;
- abrir usuarios vinculados;
- abrir vendedores vinculados;
- excluir;
- desbloquear cliente;
- desbloquear cliente na plataforma;
- abrir logs quando permitido.

Esse conjunto foi herdado do legado e mantido no v2 em formato de acoes por linha.

## Formulario

### Composicao geral

O formulario principal esta em [cliente-form-page.tsx](../src/features/clientes/components/cliente-form-page.tsx).

Responsabilidades do container:

- carregar o cliente;
- controlar a aba ativa;
- salvar o registro principal;
- montar breadcrumb;
- mostrar `Salvar` no topo quando o rodape nao esta visivel;
- compor as abas.

O container nao concentra mais a logica de cada relacao.

### Abas atuais

Abas principais:

- Geral;
- Classificacao;
- Filiais;
- Vendedores;
- Formas de pagamento;
- Condicoes de pagamento;
- Dados adicionais.

Critico:

- a barra de abas so exibe o que faz sentido para o estado atual;
- em criacao, apenas parte das abas fica disponivel;
- abas relacionais aparecem quando o registro ja existe.

### Responsabilidade das abas relacionais

As abas relacionais sao donas do proprio fluxo:

- modal de inclusao;
- draft interno;
- validacao local;
- exclusao;
- refresh do cliente.

Isso evita que `cliente-form-page.tsx` vire um container monolitico.

## Mapeamento e payload

### `clientes-mappers.ts`

Arquivo: [clientes-mappers.ts](../src/features/clientes/services/clientes-mappers.ts)

Papel:

- converter respostas da API em modelo de formulario;
- normalizar dados para save;
- aplicar mascaras em campos sensiveis;
- converter selects e relacionamentos para o shape que a UI usa.

### Regras importantes ja tratadas

- `tipoCliente` do formulario e exposto como combo com:
  - Consumidor;
  - Revendedor;
  - Funcionario.
- no payload, esses valores sao convertidos para o contrato da API.
- campos mascarados devem carregar ja mascarados na edicao.
- campos textuais relevantes sao normalizados antes do save.

## O que o modulo consolidou no v2

`Clientes` foi o modulo que sedimentou varios padroes do v2:

- data table base com filtros embutidos;
- toolbar compacta da listagem;
- save no topo quando o rodape nao esta visivel;
- relacoes isoladas em subcomponentes;
- toasts no lugar de cards fixos de erro;
- i18n desde a feature ate os componentes compartilhados.

## Diferencas em relacao ao legado

### O que foi mantido

- comportamento funcional da listagem;
- relacoes e modais auxiliares;
- segregacao por permissao;
- fluxo operacional de desbloqueio e vinculacoes.

### O que mudou

- o legado concentrava mais logica na propria tela e em scripts acoplados;
- o v2 distribui essa logica em:
  - controller da listagem;
  - subcomponentes das abas;
  - componentes compartilhados;
  - mapeadores de payload.

Resultado:

- menos acoplamento estrutural;
- mesma regra de negocio;
- mais previsibilidade para evoluir.

## Papel do modulo como referencia

Ao analisar novas telas no v2, `Clientes` serve como referencia para responder:

- quando uma tela nao deve entrar em `CrudFormPage`;
- como quebrar um formulario grande em abas;
- como isolar relacoes sem empurrar tudo para o container;
- como manter uma listagem rica sem perder padrao visual.

## Menus operacionais do cliente

O fechamento da migração do menu do cliente no v2 aproveitou os mesmos princípios consolidados em `Clientes`, mesmo sem reaproveitar a mesma base final de composição.

Menus concluídos:

- `Meus atendimentos` em [meus-atendimentos-page.tsx](../src/features/meus-atendimentos/components/meus-atendimentos-page.tsx), com bridge App Router para Intercom, filtros embutidos, detalhe em modal e subpágina de vínculo em [intercom-binding-page.tsx](../src/features/meus-atendimentos/components/intercom-binding-page.tsx);
- `Base de conhecimento` em [base-conhecimento-page.tsx](../src/features/base-conhecimento/components/base-conhecimento-page.tsx), com listagem server-side de artigos do Intercom e leitura em overlay;
- `Atualizações gerais` em [atualizacoes-gerais-page.tsx](../src/features/atualizacoes-gerais/components/atualizacoes-gerais-page.tsx), com bridge para `changelog`, filtros no padrão do v2 e agrupamento por mês.

Padroes reaproveitados:

- `PageHeader` e breadcrumb no topo;
- `SectionCard` como surface principal;
- `DataTableFiltersCard` e `DataTableFilterToggleAction` para preservar o ritmo visual do shell;
- `AppDataTable` nas telas de listagem;
- `OverlayModal` para leitura de conteúdo rico sem voltar ao legado.
