'use client'

import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { SectionCard } from '@/src/components/ui/section-card'
import { SelectableDataTable } from '@/src/components/ui/selectable-data-table'
import { bannersClient } from '@/src/features/banners/services/banners-client'
import type { BannerUrlRecord } from '@/src/features/banners/types/banners-relations'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { useI18n } from '@/src/i18n/use-i18n'

type BannerUrlsTabProps = {
  entityId: string
  readOnly: boolean
  form: CrudRecord
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}

function getSelectedUrls(form: CrudRecord) {
  if (!Array.isArray(form.urls)) {
    return []
  }

  return form.urls
    .map((item) => (typeof item === 'object' && item !== null && 'url' in item && typeof item.url === 'string' ? item.url : ''))
    .filter((item) => item.length > 0)
}

export function BannerUrlsTab({
  entityId,
  readOnly,
  form,
  onRefresh,
  onError,
}: BannerUrlsTabProps) {
  const { t } = useI18n()
  const [items, setItems] = useState<BannerUrlRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedFromForm = useMemo(() => getSelectedUrls(form), [form])

  useEffect(() => {
    setSelectedIds(selectedFromForm)
  }, [selectedFromForm])

  useEffect(() => {
    let alive = true

    async function loadUrls() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await bannersClient.listAvailableUrls()
        if (!alive) {
          return
        }

        setItems(Array.isArray(response.data) ? response.data : [])
      } catch (loadError) {
        if (!alive) {
          return
        }

        setError(loadError instanceof Error ? loadError.message : t('marketing.banners.urls.loadError', 'Não foi possível carregar as URLs disponíveis.'))
      } finally {
        if (alive) {
          setIsLoading(false)
        }
      }
    }

    void loadUrls()

    return () => {
      alive = false
    }
  }, [t])

  async function handleSave() {
    setIsSaving(true)
    setError(null)

    try {
      await bannersClient.saveUrls(entityId, selectedIds)
      await onRefresh()
      onError(null)
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : t('marketing.banners.urls.saveError', 'Não foi possível salvar as URLs do banner.')
      setError(message)
      onError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AsyncState isLoading={isLoading} error={error || undefined}>
      <SectionCard
        title={t('marketing.banners.urls.title', 'URLs')}
        action={!readOnly ? (
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
          </button>
        ) : null}
      >
        <SelectableDataTable<BannerUrlRecord>
          items={items}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          getRowId={(item) => item.url}
          emptyMessage={t('marketing.banners.urls.empty', 'Nenhuma URL da empresa foi encontrada.')}
          columns={[
            {
              header: t('marketing.banners.urls.columns.url', 'URL'),
              cellClassName: 'font-semibold text-slate-950',
              render: (item) => item.url,
            },
          ]}
        />
      </SectionCard>
    </AsyncState>
  )
}
