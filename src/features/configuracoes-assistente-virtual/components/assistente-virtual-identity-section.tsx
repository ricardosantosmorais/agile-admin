'use client'

import { AssetUploadField } from '@/src/components/ui/asset-upload-field'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import type { ConfiguracoesAssistenteVirtualFormValues } from '@/src/features/configuracoes-assistente-virtual/types/configuracoes-assistente-virtual'
import { formatDateTime } from '@/src/lib/date-time'
import type { UploadAssetHandler } from '@/src/lib/uploads'

type FieldMetadata = {
  updatedAt: string
  updatedBy: string
}

type Props = {
  values: ConfiguracoesAssistenteVirtualFormValues
  metadata: Partial<Record<keyof ConfiguracoesAssistenteVirtualFormValues, FieldMetadata>>
  canEdit: boolean
  patch: <K extends keyof ConfiguracoesAssistenteVirtualFormValues>(key: K, value: ConfiguracoesAssistenteVirtualFormValues[K]) => void
  uploadHandler: UploadAssetHandler
  t: (key: string, fallback: string, params?: Record<string, string>) => string
}

function MetadataLine({
  metadata,
  t,
}: {
  metadata?: FieldMetadata
  t: Props['t']
}) {
  if (!metadata) {
    return null
  }

  return (
    <p className="mt-3 text-xs leading-5 text-slate-500">
      {t('configuracoes.virtualAssistant.lastUpdated', 'Ãšltima alteraÃ§Ã£o: {{date}} por {{user}}', {
        date: formatDateTime(metadata.updatedAt),
        user: metadata.updatedBy,
      })}
    </p>
  )
}

export function AssistenteVirtualIdentitySection({
  values,
  metadata,
  canEdit,
  patch,
  uploadHandler,
  t,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.15rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
          <FormField label={t('configuracoes.virtualAssistant.fields.ia_ativo.label', 'Assistente ativo')} asLabel={false}>
            <select
              value={values.ia_ativo}
              onChange={(event) => patch('ia_ativo', event.target.value)}
              disabled={!canEdit}
              className={inputClasses()}
            >
              <option value="1">{t('common.yes', 'Sim')}</option>
              <option value="0">{t('common.no', 'NÃ£o')}</option>
            </select>
          </FormField>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {t('configuracoes.virtualAssistant.fields.ia_ativo.helper', 'Ativa ou desativa o assistente virtual para o tenant.')}
          </p>
          <MetadataLine metadata={metadata.ia_ativo} t={t} />
        </div>

        <div className="rounded-[1.15rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
          <FormField label={t('configuracoes.virtualAssistant.fields.ia_nome.label', 'Nome do assistente')} asLabel={false}>
            <input
              value={values.ia_nome}
              onChange={(event) => patch('ia_nome', event.target.value)}
              readOnly={!canEdit}
              maxLength={32}
              className={inputClasses()}
            />
          </FormField>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {t('configuracoes.virtualAssistant.fields.ia_nome.helper', 'Nome exibido para o assistente virtual.')}
          </p>
          <MetadataLine metadata={metadata.ia_nome} t={t} />
        </div>
      </div>

      <div className="rounded-[1.15rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {t('configuracoes.virtualAssistant.fields.ia_avatar.label', 'Avatar')}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t('configuracoes.virtualAssistant.fields.ia_avatar.helper', 'Imagem usada para representar o assistente virtual na experiÃªncia do tenant.')}
          </p>
        </div>

        <div className="max-w-2xl">
          <AssetUploadField
            kind="image"
            value={values.ia_avatar}
            onChange={(nextValue) => patch('ia_avatar', nextValue)}
            disabled={!canEdit}
            onUploadFile={uploadHandler}
            accept={{
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/png': ['.png'],
              'image/gif': ['.gif'],
              'image/webp': ['.webp'],
              'image/svg+xml': ['.svg'],
            }}
            title={t('configuracoes.virtualAssistant.avatarUploadTitle', 'Enviar avatar')}
            description={t('configuracoes.virtualAssistant.avatarUploadDescription', 'Use uma imagem clara, com fundo limpo e boa leitura em tamanhos menores.')}
            formatsLabel={t('uploads.imageFormats', 'Formatos JPG, PNG, GIF, SVG ou WEBP')}
          />
        </div>

        <MetadataLine metadata={metadata.ia_avatar} t={t} />
      </div>
    </div>
  )
}

