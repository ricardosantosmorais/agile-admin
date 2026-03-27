# 27 - Módulo Limites de Crédito

## Escopo desta rodada
- `Limites de crédito`

## Referências usadas
- legado:
  - `C:\Projetos\admin\components\limites-credito-list.php`
  - `C:\Projetos\admin\components\limites-credito-form.php`
  - `C:\Projetos\admin\controllers\limites-credito-controller.php`
- api-v3:
  - `C:\Projetos\api-v3\app\Models\LimiteCredito.php`
  - `C:\Projetos\api-v3\routes\api.php`

## Comportamento migrado
- listagem server-side com:
  - `ID`
  - `Código`
  - `Nome`
  - `Forma de entrega`
  - `Ativo`
- formulário linear com:
  - `Ativo`
  - `Forma de entrega`
  - `Código`
  - `Nome`
  - bloco `Cartão de crédito`
    - `Valor do pedido`
    - `Pedidos por dia`
    - `Valor por dia`
    - `Pedidos por mês`
    - `Valor por mês`

## Contrato
- leitura com `embed=forma_entrega`
- escrita em `/limites_credito`
- números monetários serializados como `numeric`
- contadores serializados como `integer`
- `id_forma_entrega` enviado como `nullable`

## Estrutura no v2
- bridge:
  - `app/api/limites-credito/*`
- feature:
  - `src/features/limites-credito/*`
- rotas protegidas:
  - `/limites-de-credito`
  - `/limites-de-credito/novo`
  - `/limites-de-credito/[id]/editar`

## Cobertura mínima
- unitário:
  - serialização e normalização do config
- E2E:
  - criar
  - filtrar
  - editar
  - excluir
