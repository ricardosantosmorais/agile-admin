# 41 - Modulo Configuracoes > Assistentes e Parametros

## Escopo
Este bloco cobre os tres itens finais do menu de Configuracoes:

- `Assistente virtual`
- `Parametros`
- `Assistente de vendas IA`

## Assistente virtual

### Origem no legado
- `components/configuracoes-ia-form.php`
- `controllers/configuracoes-ia-controller.php`

### Implementacao no v2
- rota: `/configuracoes/assistente-virtual`
- bridge: `app/api/configuracoes/assistente-virtual/route.ts`
- pagina: `src/features/configuracoes-assistente-virtual/components/configuracoes-assistente-virtual-page.tsx`
- shell compartilhado da feature: `src/components/form-page/manual-form-page-shell.tsx`

### Comportamento
- formulario direto, sem listagem intermediaria;
- leitura e gravacao em `empresas/parametros`;
- upload do avatar no bucket publico do tenant, em `imgs/`;
- botao `Salvar` habilita apenas quando ha alteracao;
- payload parcial, enviando somente as chaves alteradas.

## Parametros

### Origem no legado
- `components/parametros-empresa-list.php`
- `components/parametros-empresa-form.php`
- `controllers/parametros-empresa-controller.php`

### Implementacao no v2
- lista: `/configuracoes/parametros`
- novo: `/configuracoes/parametros/novo`
- edicao: `/configuracoes/parametros/[id]/editar`
- bridges:
  - `app/api/configuracoes/parametros/route.ts`
  - `app/api/configuracoes/parametros/[id]/route.ts`

### Comportamento
- listagem server-side com filtros por `ID`, `Chave`, `Filial`, `Descricao`, `Parametros`, `Posicao`, `Permissao` e `Ativo`;
- acao `Visualizar` por linha, abrindo modal;
- acao `Editar` por linha;
- formulario com editor JSON compartilhado;
- botao `Restaurar` volta o formulario ao estado carregado;
- validacao basica de JSON antes do save.

### Observacao de contrato
No v2, este modulo segue `empresas/parametros` na `api-v3`, com `componente=1` e `embed=filial`, igual ao fluxo efetivamente usado no legado.

## Assistente de vendas IA

### Origem no legado
- `components/chatbot-empresa-form.php`

### Implementacao no v2
- rota: `/configuracoes/assistente-vendas-ia`
- bridge: `app/api/configuracoes/assistente-vendas-ia/route.ts`
- pagina: `src/features/configuracoes-assistente-vendas-ia/components/configuracoes-assistente-vendas-ia-page.tsx`

### Comportamento
- o assistente externo e carregado dentro do v2, em iframe;
- o token JWT e gerado server-side no Admin v2;
- em ambiente local, se `ASSISTENTE_VENDAS_IA_JWT_SECRET` nao estiver definido, o v2 tenta reaproveitar o `JWT_SECRET` do legado para manter compatibilidade de desenvolvimento;
- o iframe permanece embutido na experiencia do painel;
- o usuario ainda pode abrir o ambiente externo em nova guia quando precisar.

### Variaveis de ambiente
- `ASSISTENTE_VENDAS_IA_URL`
- `ASSISTENTE_VENDAS_IA_JWT_SECRET`

## Testes

### Cobertura criada
- unitario de mapeadores:
  - `src/features/configuracoes-assistente-virtual/services/configuracoes-assistente-virtual-mappers.test.ts`
  - `src/features/parametros/services/parametros-mappers.test.ts`

### Gap atual
- ainda nao entrou E2E dedicado para `Assistente virtual`, `Parametros` e `Assistente de vendas IA`;
- o proximo passo recomendado e criar:
  - smoke de carregamento do formulario de `Assistente virtual`;
  - fluxo feliz de `Parametros` com abrir modal e entrar em edicao;
  - smoke do embed do `Assistente de vendas IA`.

