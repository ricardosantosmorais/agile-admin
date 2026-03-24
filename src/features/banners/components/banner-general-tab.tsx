'use client'

import { useEffect, useRef } from 'react'
import { CrudFormSections } from '@/src/components/crud-base/crud-form-sections'
import type { CrudModuleConfig, CrudOption, CrudRecord } from '@/src/components/crud-base/types'
import { useTenant } from '@/src/contexts/tenant-context'
import { bannersClient } from '@/src/features/banners/services/banners-client'
import { getBannerLinkedObjectId } from '@/src/features/banners/services/banners-mappers'

type BannerGeneralTabProps = {
  config: CrudModuleConfig
  form: CrudRecord
  readOnly: boolean
  optionsMap: Record<string, CrudOption[]>
  patch: (key: string, value: unknown) => void
}

function joinTenantUrl(baseUrl: string | undefined, link: string | null) {
  const normalizedLink = typeof link === 'string' ? link.trim() : ''
  if (!normalizedLink) {
    return ''
  }

  if (/^https?:\/\//i.test(normalizedLink)) {
    return normalizedLink
  }

  const normalizedBase = (baseUrl || '').trim().replace(/\/+$/, '')
  if (!normalizedBase) {
    return normalizedLink
  }

  const normalizedPath = normalizedLink.startsWith('/') ? normalizedLink : `/${normalizedLink}`
  return `${normalizedBase}${normalizedPath}`
}

export function BannerGeneralTab({
  config,
  form,
  readOnly,
  optionsMap,
  patch,
}: BannerGeneralTabProps) {
  const { currentTenant } = useTenant()
  const tipoLink = typeof form.tipo_link === 'string' ? form.tipo_link : ''
  const linkedObjectId = getBannerLinkedObjectId(form)
  const previousSelectionRef = useRef<string | null>(null)

  useEffect(() => {
    if ((form.id_objeto ?? '') !== linkedObjectId) {
      patch('id_objeto', linkedObjectId)
    }
  }, [form.id_objeto, linkedObjectId, patch])

  useEffect(() => {
    if (!tipoLink || !linkedObjectId) {
      previousSelectionRef.current = tipoLink && linkedObjectId ? `${tipoLink}:${linkedObjectId}` : null
      return
    }

    const selectionKey = `${tipoLink}:${linkedObjectId}`
    const previousSelection = previousSelectionRef.current
    previousSelectionRef.current = selectionKey

    if (!previousSelection && typeof form.link === 'string' && form.link.trim()) {
      return
    }

    if (previousSelection === selectionKey) {
      return
    }

    let alive = true

    async function loadPreview() {
      try {
        const result = await bannersClient.resolveLinkPreview(tipoLink, linkedObjectId)
        if (!alive) {
          return
        }

        patch('link', joinTenantUrl(currentTenant.url, result.link))
      } catch {
        if (alive) {
          patch('link', '')
        }
      }
    }

    void loadPreview()

    return () => {
      alive = false
    }
  }, [currentTenant.url, form.link, linkedObjectId, patch, tipoLink])

  return (
    <CrudFormSections
      config={config}
      form={form}
      readOnly={readOnly}
      patch={patch}
      optionsMap={optionsMap}
      sectionIds={['main']}
    />
  )
}
