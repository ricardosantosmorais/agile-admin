# Catálogos Digitais - upload de imagens dos blocos

Data: 2026-05-18

## Legado consultado

- `C:\Projetos\admin\assets\js\components\catalogos-studio.js`
- `C:\Projetos\admin\controllers\catalogos-studio-controller.php`
- `C:\Projetos\admin\components\catalogos-studio.php`

## Comportamento legado

- O Studio chama `uploadImagemSecao` ao escolher uma imagem para a seção.
- O controller valida arquivo obrigatório, extensões `jpg`, `jpeg`, `png`, `gif` e `webp`, e limite de 5 MB.
- O upload usa o bucket resolvido da empresa/tenant quando disponível.
- A URL pública retornada em `file_url` alimenta o campo de imagem do bloco.

## Implementação v2

- O editor de blocos passou a usar `AssetUploadField` no campo de imagem.
- O client `catalogosDigitaisClient.uploadSectionImage` envia o arquivo para `/api/uploads`.
- O payload usa `profileId=tenant-public-images`, pasta `catalogos-digitais/<tenantId>`, `tenantBucketUrl` da empresa ativa e `id_catalogo` quando existir.
- A chamada passa por `fetchWithTenantContext`, preservando o contexto da empresa ativa.
- O formulário bloqueia formatos fora de JPG, PNG, GIF e WEBP, e bloqueia arquivos acima de 5 MB antes de chamar a bridge.
- A URL retornada é gravada em `section.banner_url` e segue no snapshot salvo.

## Validação focada

- `.\npxw.cmd vitest run src/features/catalogos-digitais/services/catalogos-digitais-client.test.ts src/features/catalogos-digitais/components/catalogos-digitais-form-page.test.tsx --testTimeout=15000`

Resultado: 2 arquivos, 7 testes, passou.

