# 04 - Acesso, Menu e Navegação

## Controle de acesso
No legado, acesso era controlado principalmente por:
- `includes/acesso.php`
- `checkPermissao`
- injeção de flags por módulo

No v2, isso foi centralizado em:
- [permissions.ts](../src/features/auth/services/permissions.ts)

O arquivo resolve acesso por `FeatureKey` e expõe ações como:
- `canList`
- `canCreate`
- `canEdit`
- `canView`
- `canDelete`
- `canLogs`
- `canUnblockClient`

## Estratégia
O v2 mantém o conceito do legado:
- permissão por funcionalidade;
- associação de filhos e ações;
- master com acesso amplo.

Diferença principal:
- o frontend agora recebe um contrato de sessão estruturado;
- o mapeamento de acesso é feito em memória no cliente;
- os componentes de página já usam `useFeatureAccess(featureKey)`.

## Menu
Arquivos centrais:
- [menu-items.ts](../src/components/navigation/menu-items.ts)
- [sidebar.tsx](../src/components/shell/sidebar.tsx)
- [topbar.tsx](../src/components/shell/topbar.tsx)

## Como o menu é montado
O menu do v2 parte de três fontes:
1. funcionalidades reais da sessão;
2. regras especiais para tenant root;
3. extras operacionais do shell.

O sistema já faz:
- tradução de labels;
- de/para de ícones Font Awesome do legado para Lucide;
- rota implementada x fallback para `/legacy/...`;
- distinção entre link interno, externo e ação como logout.

## Navegação
Padrões adotados:
- `PageHeader` com breadcrumb;
- listagens com `Atualizar` no header;
- filtros embutidos no card da listagem;
- formulários com `Salvar` no topo e no rodapé;
- modais bloqueantes para sessão;
- fallback de 404 para telas ainda não migradas.

## Shell
O shell já cobre:
- troca de tenant;
- quick access por funcionalidade;
- notificações;
- menu lateral real;
- seletor de idioma;
- usuário logado;
- modo claro/escuro.

