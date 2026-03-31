# 15 - Modulo Administradores

## Objetivo
`Administradores` representa no v2 um modulo administrativo classico:
- listagem;
- criacao;
- edicao;
- exclusao;
- alteracao de senha em tela dedicada.

Diferente de `Usuarios`, aqui existe formulario principal completo. Diferente de `Clientes`, a complexidade operacional e menor. Por isso, este modulo e uma boa referencia de como usar as bases compartilhadas em um CRUD administrativo mais direto.

## Estrutura da feature

Arquivos principais:
- [administradores-list-page.tsx](../src/features/administradores/components/administradores-list-page.tsx)
- [administrador-form-page.tsx](../src/features/administradores/components/administrador-form-page.tsx)
- [administrador-password-page.tsx](../src/features/administradores/components/administrador-password-page.tsx)
- [administradores-config.tsx](../src/features/administradores/services/administradores-config.tsx)
- [administradores-client.ts](../src/features/administradores/services/administradores-client.ts)
- [administradores-mappers.ts](../src/features/administradores/services/administradores-mappers.ts)

## Papel arquitetural do modulo
`Administradores` e a referencia do projeto para um CRUD administrativo completo apoiado quase inteiramente na base compartilhada.

Hoje o modulo usa:
- `CrudFormPage`;
- `useCrudListController`;
- `AppDataTable`;
- `PageHeader`;
- `ConfirmDialog`;
- `PasswordRulesFeedback`.

Isso permite manter o modulo enxuto sem perder paridade funcional com o legado.

## Listagem

### Base usada
A listagem em [administradores-list-page.tsx](../src/features/administradores/components/administradores-list-page.tsx) nao usa `CrudListPage` direto, mas ja esta muito proxima da base:
- `useCrudListController` controla filtros, pagina, ordenacao, selecao e exclusao;
- `ADMINISTRADORES_CONFIG` concentra colunas, details e labels;
- a pagina ficou responsavel apenas pela composicao final e pelas acoes especificas.

### Comportamento atual
A tela suporta:
- filtros server-side;
- ordenacao server-side;
- exclusao simples e em lote;
- navegacao para editar;
- navegacao para alterar senha;
- linha expansivel com detalhes.

### Relacao com o legado
No legado, `Administradores` ja era uma tela madura e funcional. O v2 reproduz esse papel sem manter a estrutura antiga de scripts e templates acoplados.

O que mudou:
- o controller de listagem saiu da pagina;
- as colunas e filtros foram centralizados em config;
- a tela passou a seguir o padrao visual do v2.

## Formulario

### Base usada
[administrador-form-page.tsx](../src/features/administradores/components/administrador-form-page.tsx) e hoje um wrapper fino de [CrudFormPage](../src/components/crud-base/crud-form-page.tsx).

Isso foi possivel porque o formulario:
- e linear;
- nao tem abas operacionais densas;
- nao exige tabelas relacionais internas;
- cabe bem em configuracao.

### O que a config centraliza
[administradores-config.tsx](../src/features/administradores/services/administradores-config.tsx) concentra:
- campos e layout;
- perfil como options assincronas;
- senha e confirmacao apenas na criacao;
- acao contextual de `Alterar senha`;
- path de redirecionamento apos salvar.

Esse desenho e a melhor expressao atual do conceito de `CrudFormPage`.

## Alteracao de senha

### Tela dedicada
Arquivo: [administrador-password-page.tsx](../src/features/administradores/components/administrador-password-page.tsx)

O fluxo de senha e separado do formulario principal, como no legado.

### Padrao compartilhado
A tela usa:
- `PasswordRulesFeedback`;
- regras de senha compartilhadas;
- i18n;
- `Salvar` no topo quando o rodape nao esta visivel.

Com isso, `Administradores` e `Usuarios` mantem o mesmo comportamento de UX para senha, apesar de serem modulos diferentes.

## Cliente de dados

### `administradores-client.ts`
Arquivo: [administradores-client.ts](../src/features/administradores/services/administradores-client.ts)

Responsabilidades:
- listar administradores;
- carregar detalhe;
- salvar;
- excluir;
- listar perfis;
- alterar senha.

O modulo deixou de usar dados fake e passou a trabalhar com API real.

## Papel do modulo como referencia
`Administradores` serve como referencia do projeto para:
- CRUD administrativo linear;
- formulario configuravel;
- listagem convergida para controller compartilhado;
- senha em tela dedicada;
- uso disciplinado da base sem excesso de codigo manual.

## Quando copiar esse padrao
Use `Administradores` como referencia quando o novo modulo tiver:
- listagem padrao;
- formulario linear;
- poucos relacionamentos;
- pouca necessidade de modais operacionais pesados;
- acao auxiliar isolada, como senha ou logs.
