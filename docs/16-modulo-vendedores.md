# 16 - Modulo Vendedores

## Objetivo
`Vendedores` ocupa um meio-termo importante na arquitetura do v2.

Ele nao e um CRUD simples como `Administradores`, mas tambem nao chega ao mesmo nivel de densidade de `Clientes`.

O modulo combina:
- listagem operacional;
- formulario com aba principal e aba relacional;
- vinculacao com usuarios;
- canais de distribuicao;
- validacoes de pessoa fisica e juridica.

## Estrutura da feature

Arquivos principais:
- [vendedores-list-page.tsx](../src/features/vendedores/components/vendedores-list-page.tsx)
- [vendedor-form-page.tsx](../src/features/vendedores/components/vendedor-form-page.tsx)
- [vendedor-canais-tab.tsx](../src/features/vendedores/components/vendedor-canais-tab.tsx)
- [vendedor-linked-users-modal.tsx](../src/features/vendedores/components/vendedor-linked-users-modal.tsx)
- [vendedores-client.ts](../src/features/vendedores/services/vendedores-client.ts)
- [vendedores-config.tsx](../src/features/vendedores/services/vendedores-config.tsx)
- [vendedores-form.ts](../src/features/vendedores/services/vendedores-form.ts)
- [vendedores.ts](../src/features/vendedores/types/vendedores.ts)

## Papel arquitetural do modulo
`Vendedores` e um modulo proprio apoiado em componentes compartilhados.

Ele nao foi encaixado em `CrudFormPage` porque:
- existe aba relacional de canais;
- o formulario tem validacoes condicionais de PF/PJ;
- existem multiplos lookups especificos;
- ha modal operacional de usuarios vinculados.

Mesmo assim, o modulo reutiliza bastante base comum:
- `PageHeader`;
- `SectionCard`;
- `AppDataTable`;
- `useCrudListController`;
- `LookupSelect`;
- `BooleanSegmentedField`;
- `ConfirmDialog`;
- `PageToast`.

## Listagem

### Controller
A listagem usa `useCrudListController`.

Isso permite manter fora da pagina:
- filtros;
- pagina;
- ordenacao;
- persistencia;
- exclusao;
- selecao.

### O que continua local
[vendedores-list-page.tsx](../src/features/vendedores/components/vendedores-list-page.tsx) continua local porque concentra a parte operacional:
- abrir usuarios vinculados;
- carregar usuarios vinculados do vendedor;
- remover vinculo de usuario;
- compor a listagem com actions especificas.

Esse e um bom exemplo de tela que reaproveita controller compartilhado sem perder identidade da feature.

## Formulario

### Estrutura
[vendedor-form-page.tsx](../src/features/vendedores/components/vendedor-form-page.tsx) trabalha com duas abas:
- Geral;
- Canais de distribuicao.

O container centraliza:
- carga do registro;
- save do vendedor;
- navegacao apos salvar;
- controle da aba ativa;
- save no topo quando o rodape nao esta visivel.

### Validacoes importantes
O modulo trata:
- CPF ou CNPJ obrigatorio conforme `PF` ou `PJ`;
- nome para pessoa fisica;
- nome fantasia para pessoa juridica;
- validacao de e-mail;
- mascaras em documentos e telefones;
- carga mascarada na edicao.

Isso foi trazido do legado e ajustado ao modelo do v2.

### Lookups
O formulario usa autocomplete para:
- filial;
- supervisor;
- canal de distribuicao padrao.

Esse comportamento vive no proprio modulo, nao na base generica.

## Aba de canais de distribuicao

### Componente dedicado
Arquivo: [vendedor-canais-tab.tsx](../src/features/vendedores/components/vendedor-canais-tab.tsx)

Papel:
- listar canais do vendedor;
- incluir novos canais;
- excluir canais;
- refletir valores corretamente no formato monetario esperado.

Essa aba reforca por que `Vendedores` nao cabe bem em `CrudFormPage` puro.

## Modal de usuarios vinculados

### Componente dedicado
Arquivo: [vendedor-linked-users-modal.tsx](../src/features/vendedores/components/vendedor-linked-users-modal.tsx)

Papel:
- listar usuarios vinculados ao vendedor;
- remover vinculacao;
- tratar erros operacionais desse fluxo.

Esse modal aproxima `Vendedores` de `Clientes` no aspecto operacional da listagem.

## Mapeadores e payload

### `vendedores-form.ts`
Arquivo: [vendedores-form.ts](../src/features/vendedores/services/vendedores-form.ts)

Responsabilidades:
- criar estado inicial;
- mapear detalhe para o formulario;
- aplicar mascaras na carga;
- converter o formulario no payload de save.

Esse arquivo concentra a inteligencia de transformacao da feature.

## Papel do modulo como referencia
`Vendedores` e a referencia do projeto para modulos que ficam entre o CRUD simples e o modulo operacional denso.

Ele responde bem a situacoes como:
- formulario com algumas abas, mas nao muitas;
- relacao interna relevante;
- listagem com modais especificos;
- regras condicionais por tipo de pessoa;
- uso combinado de controller compartilhado e componentes locais.

## Quando copiar esse padrao
Use `Vendedores` como referencia quando o novo modulo tiver:
- formulario principal proprio;
- ao menos uma aba relacional;
- validacoes condicionais relevantes;
- modais especificos na listagem;
- necessidade de controller compartilhado, mas nao de pagina generica completa.
