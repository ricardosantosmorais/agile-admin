# 24 - Módulo Logística Básica

## Escopo
Esta etapa fecha a base simples do menu `Logística` no `admin-v2-web` para os módulos:
- Transportadoras
- Portos
- Áreas de atuação
- Praças
- Rotas

`Formas de entrega` foi concluído em etapa posterior e está documentado separadamente.

## Referências usadas
- Legado em `C:\Projetos\admin`
- Controllers e componentes PHP/JS dos módulos de logística
- `api-v3` em `C:\Projetos\api-v3`

## Aderência ao legado

### Transportadoras
- CRUD linear, sem abas, com suporte a PF e PJ.
- Mantém o contrato legado/API com `cnpj_cpf`, `ddd1/telefone1`, `ddd2/telefone2`, `ddd_celular/celular`, endereço e `ativo`.
- O formulário do v2 usa campos auxiliares de PF/PJ apenas na UI e serializa para o payload real antes de salvar.

### Portos
- CRUD simples com `codigo`, `nome` e `ativo`.

### Áreas de atuação
- CRUD simples com `id_praca`, faixa de CEP, `codigo`, `nome` e `ativo`.
- O payload remove máscara de CEP e mantém `id_praca` opcional, como no legado.

### Praças
- CRUD simples com `id_rota`, `id_tabela_preco`, faixa de CEP, `pedido_minimo`, `peso_minimo`, `codigo`, `nome` e `ativo`.
- Os valores monetários e decimais são normalizados no mapper antes do envio.

### Rotas
- CRUD simples com janela operacional (`horario_corte`, `prazo_entrega`, `prazo_fixo`, `limite_entregas`, `limite_peso`) e dias da semana.
- O novo formulário respeita o comportamento legado de iniciar todos os dias marcados.

## Arquitetura no v2
- Listas e formulários usam `CrudListPage` e `CrudFormPage`.
- Integrações passam por `app/api/*`.
- Lookups usam a infraestrutura já existente de `CrudFormPage`.
- Permissões foram mapeadas no resolver central de features.
- Menu dinâmico passou a resolver as rotas modernas desses componentes.

## Cobertura entregue
- Unitário para serialização e defaults de logística.
- E2E autenticado cobrindo o fluxo feliz principal dos cinco módulos via tela.

## Pendências conhecidas
- módulos mais densos de logística ainda podem exigir componentes relacionais adicionais conforme novas migrações.
