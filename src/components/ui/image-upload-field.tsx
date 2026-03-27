'use client'

import { AssetUploadField } from '@/src/components/ui/asset-upload-field'
import { useI18n } from '@/src/i18n/use-i18n'
import { base64UploadHandler, type UploadAssetHandler } from '@/src/lib/uploads'

type ImageUploadFieldProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  onUploadFile?: UploadAssetHandler
}

export function ImageUploadField({
  value,
  onChange,
  disabled = false,
  onUploadFile = base64UploadHandler,
}: ImageUploadFieldProps) {
  const { t } = useI18n()

  return (
    <AssetUploadField
      kind="image"
      value={value}
      onChange={onChange}
      disabled={disabled}
      onUploadFile={onUploadFile}
      accept={{
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp'],
        'image/svg+xml': ['.svg'],
      }}
      title={t('uploads.imageTitle', 'Arraste a imagem ou clique para enviar')}
      description={t('uploads.imageDescription', 'Envie uma imagem para o campo. O componente está pronto para trocar entre upload inline, controller legado ou S3 direto conforme o módulo.')}
      formatsLabel={t('uploads.imageFormats', 'Formatos JPG, PNG, GIF, SVG ou WEBP')}
    />
  )
}
