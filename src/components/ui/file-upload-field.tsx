'use client'

import { AssetUploadField } from '@/src/components/ui/asset-upload-field'
import { useI18n } from '@/src/i18n/use-i18n'
import { base64UploadHandler, type UploadAssetHandler } from '@/src/lib/uploads'

type FileUploadFieldProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  onUploadFile?: UploadAssetHandler
  accept?: Record<string, string[]>
  formatsLabel?: string
  maxSizeLabel?: string
}

export function FileUploadField({
  value,
  onChange,
  disabled = false,
  onUploadFile = base64UploadHandler,
  accept,
  formatsLabel,
  maxSizeLabel,
}: FileUploadFieldProps) {
  const { t } = useI18n()

  return (
    <AssetUploadField
      kind="file"
      value={value}
      onChange={onChange}
      disabled={disabled}
      onUploadFile={onUploadFile}
      accept={accept}
      title={t('uploads.fileTitle', 'Arraste o arquivo ou clique para enviar')}
      description={t('uploads.fileDescription', 'Use este campo para uploads de arquivos não visuais, incluindo integrações futuras com bucket privado ou público.')}
      formatsLabel={formatsLabel || t('uploads.fileFormats', 'Formatos conforme o módulo')}
      maxSizeLabel={maxSizeLabel}
    />
  )
}
