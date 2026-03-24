# 14 - Modulo Usuarios

## Objetivo
`Usuarios` e um modulo operacional, nao um CRUD completo tradicional.

No legado, o foco do modulo era:
- listar usuarios;
- consultar acessos;
- ver clientes vinculados;
- ver vendedor vinculado;
- alterar senha.

Esse desenho foi mantido no v2.

## Estrutura da feature

Arquivos principais:
- [usuarios-list-page.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/components/usuarios-list-page.tsx)
- [usuario-password-page.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/components/usuario-password-page.tsx)
- [usuarios-config.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/services/usuarios-config.tsx)
- [usuarios-client.ts](/C:/Projetos/admin-v2-web/src/features/usuarios/services/usuarios-client.ts)
- [usuarios-mappers.ts](/C:/Projetos/admin-v2-web/src/features/usuarios/services/usuarios-mappers.ts)
- [usuarios.ts](/C:/Projetos/admin-v2-web/src/features/usuarios/types/usuarios.ts)

Modais operacionais:
- [usuario-linked-clients-modal.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/components/usuario-linked-clients-modal.tsx)
- [usuario-linked-seller-modal.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/components/usuario-linked-seller-modal.tsx)
- [usuario-accesses-modal.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/components/usuario-accesses-modal.tsx)

## Papel arquitetural do modulo
`Usuarios` tambem nao foi modelado como CRUD completo de criar/editar.

Motivo:
- no legado, o modulo principal nao era um formulario de usuario no estilo tradicional;
- o valor operacional esta nas consultas e acoes auxiliares;
- a alteracao de senha e uma tela separada.

No v2, a listagem aproveita base compartilhada, mas mantem os modais especificos da feature.

## Listagem

### Controller
Hoje a listagem usa `useCrudListController`, com configuracao em [usuarios-config.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/services/usuarios-config.tsx).

Isso centraliza:
- filtros;
- paginacao;
- ordenacao;
- persistencia;
- refresh;
- exclusao.

Com isso, [usuarios-list-page.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/components/usuarios-list-page.tsx) ficou focada em:
- definir colunas;
- abrir modais especificos;
- compor a experiencia da listagem.

### Filtros e colunas
O modulo segue o padrao global de listagem:
- breadcrumb no topo;
- `Atualizar` no `PageHeader`;
- botao `Filtros` no lado esquerdo do card;
- filtros ocultos por padrao;
- `AppDataTable` para a grade.

Colunas principais:
- e-mail;
- perfil;
- codigo do vendedor;
- ultimo acesso;
- ultimo pedido;
- ativo.

## Modais operacionais

### Clientes vinculados
Modal: [usuario-linked-clients-modal.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/components/usuario-linked-clients-modal.tsx)

Papel:
- listar clientes vinculados ao usuario;
- remover vinculo com confirmacao;
- suportar scroll interno sem rolar o fundo.

### Vendedor vinculado
Modal: [usuario-linked-seller-modal.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/components/usuario-linked-seller-modal.tsx)

Papel:
- exibir o vendedor vinculado;
- remover o vinculo com confirmacao.

### Acessos do usuario
Modal: [usuario-accesses-modal.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/components/usuario-accesses-modal.tsx)

Papel:
- exibir historico ou consulta de acessos do usuario;
- manter a leitura operacional dentro da propria listagem.

## Alteracao de senha

### Tela dedicada
Arquivo: [usuario-password-page.tsx](/C:/Projetos/admin-v2-web/src/features/usuarios/components/usuario-password-page.tsx)

A senha nao e alterada dentro de um formulario geral de usuario. O fluxo esta em rota especifica.

Esse comportamento replica o desenho operacional do legado.

### Feedback em tempo real
O modulo usa [password-rules-feedback.tsx](/C:/Projetos/admin-v2-web/src/components/ui/password-rules-feedback.tsx).

Isso garante:
- validacao visual em tempo real;
- mesma regra para `Usuarios` e `Administradores`;
- mensagens vindas do i18n, nao hardcoded na tela.

Regras atuais:
- minimo de 8 caracteres;
- pelo menos uma letra maiuscula;
- pelo menos um numero;
- pelo menos um caractere especial.

## Cliente de dados

### `usuarios-client.ts`
Arquivo: [usuarios-client.ts](/C:/Projetos/admin-v2-web/src/features/usuarios/services/usuarios-client.ts)

Responsabilidades:
- listar usuarios;
- remover usuario;
- listar clientes vinculados;
- remover cliente vinculado;
- consultar vendedor vinculado;
- remover vendedor vinculado;
- listar acessos;
- carregar dados de senha;
- alterar senha.

Esse client concentra o contrato operacional do modulo com o backend.

## Diferencas em relacao ao legado

### O que foi mantido
- foco operacional;
- senha em tela separada;
- modais de vinculacoes;
- consulta de acessos;
- listagem como ponto central do modulo.

### O que mudou
- o legado tinha mais acoplamento entre tela, script e backend;
- o v2 separa:
  - config da listagem;
  - controller compartilhado de listagem;
  - modais por responsabilidade;
  - client unico da feature;
  - componente compartilhado de regras de senha.

## Papel do modulo como referencia
`Usuarios` e a referencia do projeto para modulos operacionais sem CRUD completo de formulario principal.

Ele ajuda a orientar futuras telas que sejam:
- fortemente baseadas em listagem;
- com varias consultas auxiliares;
- com poucas operacoes de edicao direta;
- e com modais como parte central da experiencia.
