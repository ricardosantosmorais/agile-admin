import type { UploadAssetStorage, UploadAssetVisibility } from '@/src/lib/uploads'

export type UploadProfile = {
  id: string
  label: string
  description: string
  storage: UploadAssetStorage
  visibility: UploadAssetVisibility
  legacyController: string
  keyPattern: string
  acceptedFormats: string[]
  currentV2Modules: string[]
}

export const UPLOAD_PROFILES: UploadProfile[] = [
  {
    id: 'tenant-public-images',
    label: 'Imagens públicas auxiliares do tenant',
    description: 'Usado para imagens públicas do tenant com pasta definida por módulo. Pode gravar em banners/, colecoes/, combos/, listas/, marcas/, fornecedores/, departamentos/ e similares.',
    storage: 'legacy-controller',
    visibility: 'public',
    legacyController: 'controllers configuráveis por módulo, sempre no bucket público do tenant',
    keyPattern: '{tenant_bucket}/{folder}/{slug}-{timestamp}.{ext}',
    acceptedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    currentV2Modules: ['Banners', 'Coleções', 'Combos', 'Compre e Ganhe', 'Departamentos', 'Fornecedores', 'Grupos de Combos', 'Listas', 'Marcas', 'Configurações IA', 'Configurações de layout'],
  },
  {
    id: 'tenant-public-files',
    label: 'Arquivos públicos do tenant',
    description: 'Usado para central de arquivos. O legado grava no bucket público da empresa em arquivos/ com pasta opcional.',
    storage: 'legacy-controller',
    visibility: 'public',
    legacyController: 'controllers/arquivos-controller.php',
    keyPattern: '{tenant_bucket}/arquivos/{pasta?}/{file_name}',
    acceptedFormats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'zip'],
    currentV2Modules: ['Arquivos'],
  },
  {
    id: 'public-cdn-components',
    label: 'Assets públicos globais',
    description: 'Usado por componentes compartilhados no legado. O upload vai para o CDN público assets.agilecdn.com.br.',
    storage: 'legacy-controller',
    visibility: 'public',
    legacyController: 'controllers/componentes-controller.php',
    keyPattern: 'https://assets.agilecdn.com.br/componentes/{slug}-{timestamp}.{ext}',
    acceptedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    currentV2Modules: ['Componentes'],
  },
  {
    id: 'private-app-files',
    label: 'Arquivos privados de app',
    description:
      'Usado por apps mobile. O legado envia para bucket privado global com chave fixa por empresa, incluindo ícones, splash, firebase e .env.',
    storage: 'legacy-controller',
    visibility: 'private',
    legacyController: 'controllers/apps-controller.php',
    keyPattern: 'agileecommerce-files/apps/{tenant_id}/{fixed_file_name}',
    acceptedFormats: ['png', 'json', 'plist', 'env', 'txt'],
    currentV2Modules: ['Apps'],
  },
]

export const CURRENT_IMAGE_UPLOAD_USAGE = [
  { module: 'Banners', field: 'imagem', profileId: 'tenant-public-images', folder: 'banners' },
  { module: 'Banners', field: 'imagem_mobile', profileId: 'tenant-public-images', folder: 'banners' },
  { module: 'Coleções', field: 'selo', profileId: 'tenant-public-images', folder: 'colecoes' },
  { module: 'Coleções', field: 'imagem', profileId: 'tenant-public-images', folder: 'colecoes' },
  { module: 'Coleções', field: 'imagem_mobile', profileId: 'tenant-public-images', folder: 'colecoes' },
  { module: 'Combos', field: 'imagem', profileId: 'tenant-public-images', folder: 'combos' },
  { module: 'Combos', field: 'imagem_mobile', profileId: 'tenant-public-images', folder: 'combos' },
  { module: 'Compre e Ganhe', field: 'imagem', profileId: 'tenant-public-images', folder: 'compre-e-ganhe' },
  { module: 'Compre e Ganhe', field: 'imagem_mobile', profileId: 'tenant-public-images', folder: 'compre-e-ganhe' },
  { module: 'Departamentos', field: 'imagem', profileId: 'tenant-public-images', folder: 'departamentos' },
  { module: 'Departamentos', field: 'imagem_mobile', profileId: 'tenant-public-images', folder: 'departamentos' },
  { module: 'Fornecedores', field: 'imagem', profileId: 'tenant-public-images', folder: 'fornecedores' },
  { module: 'Fornecedores', field: 'imagem_mobile', profileId: 'tenant-public-images', folder: 'fornecedores' },
  { module: 'Grupos de Combos', field: 'imagem', profileId: 'tenant-public-images', folder: 'grupos-combos' },
  { module: 'Listas', field: 'imagem', profileId: 'tenant-public-images', folder: 'listas' },
  { module: 'Listas', field: 'imagem_mobile', profileId: 'tenant-public-images', folder: 'listas' },
  { module: 'Marcas', field: 'imagem', profileId: 'tenant-public-images', folder: 'marcas' },
  { module: 'Marcas', field: 'imagem_mobile', profileId: 'tenant-public-images', folder: 'marcas' },
] as const

export function getUploadProfile(profileId?: string | null) {
  if (!profileId) {
    return null
  }

  return UPLOAD_PROFILES.find((profile) => profile.id === profileId) ?? null
}
