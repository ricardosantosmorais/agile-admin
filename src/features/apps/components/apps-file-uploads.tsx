'use client'

import { AssetUploadField } from '@/src/components/ui/asset-upload-field'
import { createMultipartUploadHandler, type UploadAssetHandler } from '@/src/lib/uploads'
import { getAppFileName, getAppFilePreviewUrl } from '@/src/features/apps/services/apps-mappers'
import type { CrudRecord } from '@/src/components/crud-base/types'

type AppFileUploadDefinition = {
  key: string
  tipo: string
  kind: 'image' | 'file'
  title: string
  description: string
  formatsLabel: string
  maxSizeLabel: string
  accept: Record<string, string[]>
}

const APP_FILE_UPLOADS: AppFileUploadDefinition[] = [
  {
    key: 's3_logo_1024_key',
    tipo: 'logo_1024',
    kind: 'image',
    title: 'Logo do app',
    description: 'Imagem quadrada usada como ícone do app. O legado grava com nome fixo icone_1024.png.',
    formatsLabel: 'PNG ou JPG 1024x1024',
    maxSizeLabel: 'Máx. 2MB',
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
  },
  {
    key: 's3_splash_logo_key',
    tipo: 'splash_logo',
    kind: 'image',
    title: 'Splash do app',
    description: 'Imagem quadrada exibida na abertura do app. O legado grava com nome fixo splash_1024.png.',
    formatsLabel: 'PNG ou JPG 1024x1024',
    maxSizeLabel: 'Máx. 2MB',
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
  },
  {
    key: 's3_firebase_android_key',
    tipo: 'firebase_android',
    kind: 'file',
    title: 'Firebase Android',
    description: 'Arquivo google-services.json usado no build Android.',
    formatsLabel: 'JSON',
    maxSizeLabel: 'Máx. 2MB',
    accept: { 'application/json': ['.json'] },
  },
  {
    key: 's3_firebase_ios_key',
    tipo: 'firebase_ios',
    kind: 'file',
    title: 'Firebase iOS',
    description: 'Arquivo GoogleService-Info.plist usado no build iOS.',
    formatsLabel: 'PLIST',
    maxSizeLabel: 'Máx. 2MB',
    accept: { 'application/xml': ['.plist'], 'text/xml': ['.plist'] },
  },
]

function buildUploadHandler(tipo: string, idEmpresa: string): UploadAssetHandler {
  return async (file) => {
    if (!idEmpresa) {
      throw new Error('Selecione uma empresa antes de enviar arquivos.')
    }

    const handler = createMultipartUploadHandler({
      endpoint: '/api/apps/files',
      extraFields: { tipo, id_empresa: idEmpresa },
      mapResponse: (payload) => {
        const record = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {}
        const s3Key = String(record.s3_key ?? record.value ?? '').trim()
        if (!s3Key) {
          throw new Error('Resposta de upload inválida.')
        }

        return {
          value: s3Key,
          previewValue: String(record.previewValue ?? getAppFilePreviewUrl(s3Key)),
          fileName: String(record.file_name ?? file.name),
          storageKey: s3Key,
        }
      },
    })

    return handler(file)
  }
}

export function AppsFileUploads({
  form,
  patch,
  readOnly,
}: {
  form: CrudRecord
  patch: (key: string, value: unknown) => void
  readOnly: boolean
}) {
  const idEmpresa = String(form.id_empresa ?? '').trim()

  return (
    <div className="space-y-4">
      {!idEmpresa ? (
        <div className="app-control-muted rounded-[1rem] px-4 py-3 text-sm text-[color:var(--app-muted)]">
          <span className="font-semibold text-[color:var(--app-text)]">Selecione uma empresa</span> antes de enviar arquivos do app.
        </div>
      ) : null}

      <div className="grid gap-4">
        {APP_FILE_UPLOADS.map((definition) => {
          const s3Key = String(form[definition.key] ?? '').trim()
          const displayValue = definition.kind === 'image' ? getAppFilePreviewUrl(s3Key) : s3Key
          const fileName = getAppFileName(s3Key)

          return (
            <div key={definition.key} className="app-pane rounded-[1.25rem] border border-[color:var(--app-card-border)] p-3">
              <AssetUploadField
                kind={definition.kind}
                value={displayValue}
                onChange={(nextValue) => patch(definition.key, nextValue)}
                disabled={readOnly || !idEmpresa}
                onUploadFile={buildUploadHandler(definition.tipo, idEmpresa)}
                accept={definition.accept}
                title={definition.title}
                description={definition.description}
                formatsLabel={definition.formatsLabel}
                maxSizeLabel={definition.maxSizeLabel}
              />
              <p className="mt-2 truncate px-1 text-xs text-[color:var(--app-muted)]">
                {fileName ? `Arquivo atual: ${fileName}` : 'Nenhum arquivo enviado ainda.'}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
