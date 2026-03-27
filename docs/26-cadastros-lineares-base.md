# 26 - Cadastros Lineares Base

## Escopo
Esta etapa fecha o lote de CRUDs lineares sem abas do legado que destravam outros módulos no `admin-v2-web`:
- Filiais
- Canais de distribuição
- Grupos de filiais
- Fases
- Sequenciais

`Perfis` ficou fora deste lote. Embora o formulário legado não use abas, ele depende de árvore de funcionalidades e payload relacional próprio, então foi mantido para uma rodada específica.

## Referências usadas
- legado em `C:\Projetos\admin`
- controllers, forms PHP e JS de cada módulo
- `api-v3` em `C:\Projetos\api-v3`
- exemplos lineares já migrados no v2, com `CrudListPage` e `CrudFormPage`

## Aderência ao legado

### Filiais
- mantém os campos operacionais do legado para dados fiscais, contato, endereço, valores mínimos e flags;
- preserva serialização de CNPJ, CEP, telefone, celular e valores monetários/decimais antes do envio;
- mantém vínculo opcional com grupo de filiais.

### Canais de distribuição
- CRUD linear de `ativo`, `codigo` e `nome`;
- segue a mesma ordenação e filtro básico do legado.

### Grupos de filiais
- CRUD linear de `ativo`, `codigo`, `nome` e `id_filial_padrao`;
- mantém a filial padrão como relacionamento opcional.

### Fases
- CRUD linear de `ativo`, `codigo`, `nome`, `posicao` e `icone`;
- usa o recurso real `implantacao/fases` da `api-v3`.

### Sequenciais
- mantém o comportamento legado de usar o módulo como chave do registro;
- a lista e o formulário reaproveitam a mesma tabela estática de módulos do legado para exibir labels amigáveis;
- em edição, o módulo fica implícito e apenas o valor sequencial permanece editável.

## Estrutura adotada no v2
- listagens em `CrudListPage`;
- formulários em `CrudFormPage`;
- bridges dedicadas em `app/api/*`;
- normalização e serialização nos configs da feature, sem lógica improvisada na UI.

## Permissões e navegação
- os cinco módulos entram no menu real, sem fallback para `/legacy/...`;
- cada módulo possui `featureKey` próprio para listar, criar, editar e excluir;
- breadcrumbs seguem o agrupamento funcional esperado:
  - `Cadastros Básicos`: Filiais, Canais de distribuição, Grupos de filiais
  - `Cadastros`: Fases
  - `Manutenção`: Sequenciais

## Cobertura entregue
- testes unitários para serialização e normalização dos pontos críticos;
- E2E autenticado cobrindo abrir lista, criar, filtrar, editar e excluir via tela;
- validação de `lint`, `typecheck` e `build`.
