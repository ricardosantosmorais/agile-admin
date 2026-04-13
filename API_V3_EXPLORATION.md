# Exploração da API v3 - Estrutura de Dashboard

## Localização e Estrutura

### Pasta Raiz da api-v3

```
C:\Projetos\api-v3
```

### Estrutura de Roteamento

- **Arquivo de rotas principal**: `C:\Projetos\api-v3\routes\api.php`
- **Tipo de framework**: Laravel (PHP)
- **Estrutura de pastas**:
  - `app/Http/Controllers/` - Controllers
  - `routes/` - Definição de rotas (web.php, api.php, console.php, channels.php)
  - `config/` - Configuração
  - `database/` - Migrations e seeds
  - `resources/` - Views
  - `storage/` - Armazenamento
  - `public/` - Assets públicos

## RelatorioController.php

### Localização

```
C:\Projetos\api-v3\app\Http\Controllers\RelatorioController.php
```

### Métodos Principais

#### 1. `total()` - Dashboard v1 (Legado)

- **Rota HTTP**: `POST /relatorios/dashboard`
- **Definição em api.php**:
  ```php
  Route::post('/relatorios/dashboard', ['uses' => 'App\Http\Controllers\RelatorioController@total']);
  ```
- **Responsabilidade**: Retorna métricas básicas de dashboard (versão anterior)
- **Parâmetros**: `data_inicio`, `data_fim`
- **Retorna**:
  - `quantidade_pedidos`
  - `total_pedidos`
  - `quantidade_cancelados`
  - `media_pedidos`
  - `total_canal` (APP, Mobile, PC)
  - `total_emitente` (Vendedor vs Cliente)
  - `total_dia` (série temporal por dia)

#### 2. `totalV2()` - Dashboard v2 (Novo)

- **Rota HTTP**: `POST /relatorios/dashboard-v2`
- **Definição em api.php**:
  ```php
  Route::post('/relatorios/dashboard-v2', ['uses' => 'App\Http\Controllers\RelatorioController@totalV2']);
  ```
- **Responsabilidade**: Retorna métricas completas com cache e blocos modulares
- **Schema**: v2, versão 5
- **Parâmetros obrigatórios**:
  - `data_inicio` (string)
  - `data_fim` (string)
  - `blocos` (array, opcional - usa padrão se omitido)
  - `sem_cache` (boolean, opcional)

#### Blocos Disponíveis para dashboard-v2

Os blocos permitem solicitar apenas as seções desejadas:

- `resumo` - Métricas resumidas
- `serie` - Série temporal
- `mix` - Mix de vendas
- `funil` - Funil de conversão
- `operacao` - Dados operacionais
- `clientes` - Dados de clientes (completo)
- `clientes_resumo` - Resumo de clientes
- `clientes_listas` - Listas de clientes (top clientes, sem compra)
- `pagamentos` - Dados de pagamentos
- `produtos` - Dados de produtos
- `coorte` - Análise de coorte
- `marketing` - Dados de marketing (completo)
- `marketing_resumo` - Resumo marketing
- `marketing_mix` - Mix marketing
- `marketing_tops` - Tops marketing
- `marketing_alertas` - Alertas marketing
- `alertas` - Alertas gerais

**Blocos padrão** (usados se `blocos` não for especificado):

```
['resumo', 'serie', 'mix', 'funil', 'operacao', 'clientes', 'pagamentos', 'produtos', 'coorte', 'marketing', 'alertas']
```

### Características Técnicas

#### Cache

- **Chave de cache**: `dashboard_v2:[empresa_id]:[hash_payload]`
- **TTL padrão**: 10 minutos
- **Pode ser ignorado**: Passando `sem_cache: true`
- **Hash inclui**: schema, data_inicio, data_fim, periodo_anterior, blocos

#### Observabilidade

- Logging estruturado em JSON via `error_log()`
- Prefixo: `[api-v3-observabilidade]`
- Eventos registrados:
  - `dashboard_v2.bloco` - Métricas por bloco (duração, memória, erros)
  - `dashboard_v2.builder` - Info geral da construção
  - `dashboard_v2.request` - Info da requisição completa
  - `dashboard_v2.erro` - Erros capturados

#### Período Anterior (Comparativo)

- Suporta cálculo automático de período anterior
- Método: `resolveDashboardV2PreviousPeriod()`
- Retorna `data_inicio_anterior` e `data_fim_anterior`
- Usado para cálculos comparativos

#### Tratamento de Erros

- Blocos como `funil` e `clientes` têm fallback automático em caso de erro
- Se falhar, retorna dados mínimos estruturados com aviso
- Erros não interrompem a requisição inteira

### Método Auxiliar de Log

```php
private function dashboardV2LogBloco(
    $nomeBloco,
    $empresaId,
    $data_inicio,
    $data_fim,
    callable $callback
)
```

- Captura duração de execução (ms)
- Monitora uso de memória (inicial, fim, pico em MB)
- Registra classe de erro se houver exceção

### Autenticação e Tenant

- Usa `UsuarioController@auth()` para validar usuário
- Conecta ao banco específico de `$usuario['id_empresa']`
- Desconecta ao destruir controller via `disconnectDatabase()`

## Estrutura de Rotas em api.php

### Padrão Genérico

A maioria das rotas segue um padrão CRUD genérico:

```php
Route::get('/recurso/{id?}', ['uses' => 'App\Http\Controllers\GetController@index', 'model' => 'Recurso']);
Route::post('/recurso', ['uses' => 'App\Http\Controllers\SaveController@index', 'model' => 'Recurso']);
Route::delete('/recurso', ['uses' => 'App\Http\Controllers\DeleteController@index', 'model' => 'Recurso']);
```

### Controllers Especializados

Alguns endpoints usam controllers específicos:

- `RelatorioController` - `/relatorios/dashboard` e `/relatorios/dashboard-v2`
- `BannerController@sync` - `/banners/sync`
- `DepartamentoController@sync` - `/departamentos/sync`
- `LoginController` - Todos os endpoints de `/login`
- `PedidosController` - `/pedidos/todos`
- `NotificacaoPushAdminController@lista` - `/notificacoes_push/admin/lista`
- E vários outros especializados

## Fluxo de Requisição Dashboard v2

1. **Request chega em**: `POST /relatorios/dashboard-v2`
2. **Controller**: `RelatorioController@totalV2()`
3. **Validação**: Parâmetros obrigatórios
4. **Autenticação**: Valida usuário via `UsuarioController@auth()`
5. **Tenant**: Conecta ao BD da empresa (`connectDatabase()`)
6. **Cache check**: Verifica se resultado existe em cache (10 min)
7. **Se em cache**: Retorna do cache
8. **Se não em cache**:
   - Executa builder para cada bloco solicitado
   - Cada bloco tem seu próprio `dashboardV2LogBloco()`
   - Com fallback para erros específicos (funil, clientes)
9. **Logs**: Registra observabilidade
10. **Response**: JSON com meta + blocos solicitados

## Exemplos de Payload

### Requisição Mínima

```json
{
	"data_inicio": "2024-01-01",
	"data_fim": "2024-01-31"
}
```

(Retorna todos os blocos padrão com cache ativado)

### Requisição com Blocos Específicos

```json
{
	"data_inicio": "2024-01-01",
	"data_fim": "2024-01-31",
	"blocos": ["resumo", "serie", "alertas"]
}
```

### Requisição Sem Cache

```json
{
	"data_inicio": "2024-01-01",
	"data_fim": "2024-01-31",
	"sem_cache": true
}
```

## Estrutura de Response

```json
{
  "meta": {
    "versao": "v2",
    "schema": 5,
    "cache_ttl_minutos": 10,
    "cache_ignorado": false,
    "blocos": ["resumo", "serie", "mix", ...],
    "periodo": {
      "data_inicio": "2024-01-01",
      "data_fim": "2024-01-31",
      "data_inicio_anterior": "2023-12-01",
      "data_fim_anterior": "2023-12-31"
    }
  },
  "resumo": { ... },
  "serie": { ... },
  "funil": { ... },
  // ... outros blocos solicitados
}
```

## Integrações com v2-web

### Bridge Sugerida

Criar em `app/api/relatorios/dashboard-v2/route.ts`:

- Recebe parâmetros (data_inicio, data_fim, blocos)
- Chama POST para `{API_V3_URL}/relatorios/dashboard-v2`
- Valida resposta
- Retorna ao client

### Headers Necessários

- `Authorization`: Bearer token (já existente)
- `Content-Type`: application/json

### URL Base

A URL base da api-v3 deve estar em variável de ambiente (`.env.local` ou similar)

## Notas Técnicas

- **Tenant**: Multi-tenant onde cada empresa tem banco próprio
- **Cache distribuído**: Usa `Cache` facade do Laravel (pode ser Redis, File, etc)
- **Logging**: JSON estruturado para observabilidade centralizada
- **Performance**: Blocos modulares permitem otimização de payload
- **Tolerância a falhas**: Alguns blocos têm fallback automático
