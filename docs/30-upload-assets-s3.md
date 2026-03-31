# 30 - Uploads, Assets e S3

## Objetivo
Este documento registra o desenho atual do upload de assets no `admin-v2-web`, o mapeamento com o legado e a preparação para migrar do envio inline atual para upload real em S3.

## Estado atual do v2

Base compartilhada:
- [asset-upload-field.tsx](../src/components/ui/asset-upload-field.tsx)
- [image-upload-field.tsx](../src/components/ui/image-upload-field.tsx)
- [file-upload-field.tsx](../src/components/ui/file-upload-field.tsx)
- [uploads.ts](../src/lib/uploads.ts)
- [upload-targets.ts](../src/lib/upload-targets.ts)
- [upload-profiles.ts](../src/lib/upload-profiles.ts)
- [route.ts](../app/api/uploads/route.ts)

Comportamento:
- `ImageUploadField` continua compatível com os formulários atuais;
- a UI foi modernizada e agora usa uma base única para imagem e arquivo;
- o envio padrão ainda é inline/base64 para não quebrar as features existentes;
- a infraestrutura já aceita trocar o handler por upload multipart para bridge, controller legado ou S3 direto;
- o primeiro rollout real em S3 foi ligado para o profile `tenant-public-images` via bridge única em `app/api/uploads`.

## Perfis mapeados do legado

### `tenant-public-images`
- destino: bucket público da empresa
- bucket no legado: dinâmico por tenant, via `empresa.s3_bucket`
- ACL: `public-read`
- pastas: definidas por módulo no v2, como `banners/`, `colecoes/`, `combos/`, `compre-e-ganhe/`, `departamentos/`, `fornecedores/`, `grupos-combos/`, `listas/`, `marcas/`, além de `imgs/`, `css/` e `html/` para configurações
- controllers do legado:
  - [banners-controller.php](/C:/Projetos/admin/controllers/banners-controller.php)
  - [colecoes-controller.php](/C:/Projetos/admin/controllers/colecoes-controller.php)
  - [campanhas-compre-junto-controller.php](/C:/Projetos/admin/controllers/campanhas-compre-junto-controller.php)
  - [campanhas-descontounidade-controller.php](/C:/Projetos/admin/controllers/campanhas-descontounidade-controller.php)
  - [campanhas-levepague-controller.php](/C:/Projetos/admin/controllers/campanhas-levepague-controller.php)
  - [compre-ganhe-controller.php](/C:/Projetos/admin/controllers/compre-ganhe-controller.php)
  - [departamentos-controller.php](/C:/Projetos/admin/controllers/departamentos-controller.php)
  - [fornecedores-controller.php](/C:/Projetos/admin/controllers/fornecedores-controller.php)
  - [listas-controller.php](/C:/Projetos/admin/controllers/listas-controller.php)
  - [marcas-controller.php](/C:/Projetos/admin/controllers/marcas-controller.php)
  - [configuracoes-ia-controller.php](/C:/Projetos/admin/controllers/configuracoes-ia-controller.php)
  - [configuracoes-layout-controller.php](/C:/Projetos/admin/controllers/configuracoes-layout-controller.php)
- formatos observados: imagens, CSS e HTML

### `tenant-public-files`
- destino: bucket público da empresa
- bucket no legado: dinâmico por tenant, via `empresa.s3_bucket`
- ACL: `public-read`
- pasta: `arquivos/` com subpasta opcional
- controller do legado:
  - [arquivos-controller.php](/C:/Projetos/admin/controllers/arquivos-controller.php)
- formatos observados: `jpg`, `png`, `gif`, `pdf`, `doc`, `docx`, `xls`, `xlsx`, `csv`, `zip`

### `public-cdn-components`
- destino: CDN público global
- URL base: `https://assets.agilecdn.com.br`
- pasta: `componentes/`
- controller do legado:
  - [componentes-controller.php](/C:/Projetos/admin/controllers/componentes-controller.php)
- formatos observados: imagens

### `private-app-files`
- destino: bucket privado global
- bucket observado no legado: `agileecommerce-files`
- controller do legado:
  - [apps-controller.php](/C:/Projetos/admin/controllers/apps-controller.php)
- padrão de chave: `apps/{id_empresa}/{arquivo_fixo}`
- formatos observados:
  - `png`
  - `json`
  - `plist`
  - `.env`

## Telas do v2 que usam o componente atual

Mapeamento atual em [upload-profiles.ts](../src/lib/upload-profiles.ts), via `CURRENT_IMAGE_UPLOAD_USAGE`.

Hoje usam upload de imagem no v2:
- `Banners`
- `Coleções`
- `Combos`
- `Compre e Ganhe`
- `Departamentos`
- `Fornecedores`
- `Grupos de Combos`
- `Listas`
- `Marcas`

Rollout já ligado para envio real em S3:
- `Banners`
- `Coleções`
- `Combos`
- `Compre e Ganhe`
- `Departamentos`
- `Fornecedores`
- `Grupos de Combos`
- `Listas`
- `Marcas`

Regra atual do v2:
- todos os módulos públicos usam o mesmo profile técnico de imagem pública do tenant;
- cada tela define sua própria pasta de destino com `uploadFolder`, inclusive `Banners`.

## Regra para novas migrações

- antes de ligar um campo de upload no v2, verificar no legado:
  - controller usado pela tela;
  - bucket público ou privado;
  - pasta/chave do objeto;
  - formatos aceitos;
  - se a resposta salva URL pública, chave S3 ou ambos;
- não assumir que todo upload de imagem vai para o mesmo destino;
- não assumir que todo arquivo pode ser público;
- quando o módulo exigir download controlado ou preview autenticado, tratar como `private`.

## Variáveis de ambiente preparadas

Arquivo local:
- [`.env.local`](../.env.local)

Referência:
- [`.env.example`](../.env.example)

Chaves adicionadas:
- `UPLOAD_DRIVER`
- `UPLOAD_S3_ACCESS_KEY_ID`
- `UPLOAD_S3_SECRET_ACCESS_KEY`
- `UPLOAD_S3_REGION`
- `UPLOAD_S3_PUBLIC_BUCKET`
- `UPLOAD_S3_PRIVATE_BUCKET`
- `UPLOAD_S3_PUBLIC_BASE_URL`

Observações do legado:
- `UPLOAD_S3_PRIVATE_BUCKET` pode usar `agileecommerce-files`, que é o bucket global observado em `apps-controller.php`;
- `UPLOAD_S3_PUBLIC_BUCKET` não é fixo no legado; ele vem do tenant ativo em `empresa.s3_bucket`;
- `UPLOAD_S3_PUBLIC_BASE_URL` também é dinâmica por tenant, normalmente no formato `https://{bucket}.agilecdn.com.br`.

## Próximo passo técnico

Quando o backend/bridge de upload for ligado:
- criar uma bridge única de upload em `app/api/uploads/*`;
- usar `createMultipartUploadHandler` para cada profile;
- parar de usar base64 nas telas que já tiverem destino definido;
- manter `ImageUploadField` e `FileUploadField` sem conhecer regras específicas de bucket.
