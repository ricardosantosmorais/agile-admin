# 25 - Modulo Formas de Entrega

## Escopo
Esta etapa fecha o modulo `Formas de entrega` no menu `Logistica` do `admin-v2-web`.

O modulo inclui:
- listagem principal;
- formulario com abas;
- regras de frete;
- agendamento e datas excepcionais;
- restricoes;
- excecoes.

## Referencias usadas
- legado em `C:\Projetos\admin`
- `controllers/formas-entrega-controller.php`
- `components/formas-entrega-form.php`
- `assets/js/components/formas-entrega-form.js`
- `api-v3` em `C:\Projetos\api-v3`

## Estrutura adotada no v2
- listagem em `CrudListPage`;
- formulario em `TabbedCatalogFormPage`;
- abas proprias para `Regras`, `Agendamento`, `Restricoes` e `Excecoes`;
- bridges dedicadas em `app/api/formas-entrega/*`.

## Aderencia funcional

### Dados gerais
- mantem flags operacionais do legado;
- mantem `tipo`, `perfil`, integracao, filiais e tabela de preco;
- serializa datas e valores no contrato esperado pela `api-v3`;
- converte `restrito_transporte` entre string CSV da API e toggles da UI;
- trouxe para o v2 as descricoes operacionais relevantes do legado, como `Retira para filiais do grupo`, `Vendedor altera valor`, `Nome da transportadora` e `Servico da transportadora`.

### Listagem e filtros
- a listagem mantem tipo, filiais, posicao e status;
- os filtros de `Filial` e `Filial de retirada` usam autocomplete, aderente ao legado;
- a regra de migracao adotada passa a ser: quando o legado usa autocomplete em filtro, o v2 tambem deve usar autocomplete.

### Regras
- suporta `Faixa de CEP`, `Raio de KM` e `Localidade`;
- a listagem da aba agora segue o padrao das telas maiores do v2, com filtros, ordenacao e paginacao server-side;
- em `Localidade`, cria os vinculos em `formas_entrega/regras/cep`;
- recompoe regras complementares de CEP a partir das faixas reais de estado, cidade ou bairro;
- o modal de regras usa mascaras e afixos compativeis com o legado para valores monetarios, peso, dimensoes e percentuais;
- a selecao de `Localidade` passou a usar busca com multipla selecao para estados, cidades e bairros, mantendo o encadeamento operacional do legado.

### Agendamento
- mantem configuracao de habilitacao, janela e dias da semana;
- a aba foi reestruturada para resumo inicial + modal de edicao;
- `Datas excepcionais` agora seguem o mesmo fluxo: listagem inicial e inclusao/alteracao por modal;
- a edicao do agendamento persiste pela propria aba e recarrega o registro apos salvar.

### Restricoes e Excecoes
- mantem os tipos operacionais do legado:
  - canal de distribuicao;
  - cliente;
  - departamento;
  - filial;
  - fornecedor;
  - grupo;
  - marca;
  - produto;
  - produto pai;
  - rede;
  - segmento;
  - tipo de cliente;
  - UF;
  - todos.

## Cobertura entregue
- unitario para normalizacao e serializacao da feature;
- E2E cobrindo:
  - abrir listagem;
  - criar;
  - abrir abas;
  - incluir registros principais nas abas;
  - filtrar regras na aba relacional;
  - excluir.

## Observacoes
- a aba `Agendamento` continua disponivel somente apos a primeira gravacao, aderente ao fluxo operacional do legado;
- as regras complementares de CEP continuam tratadas na bridge para nao espalhar a logica na UI;
- a regra de helper text do legado passa a valer tambem para formularios e modais desta feature.
