'use client'

import { useEffect } from 'react'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { loadCatalogLookupOptions, type CatalogLookupResource } from '@/src/features/catalog/services/catalog-lookups'

type CatalogLookupSelectProps = {
  resource: CatalogLookupResource
  label: string
  value: LookupOption | null
  onChange: (value: LookupOption | null) => void
  disabled?: boolean
}

export function CatalogLookupSelect({
  resource,
  label,
  value,
  onChange,
  disabled = false,
}: CatalogLookupSelectProps) {
  useEffect(() => {
    if (!value?.id || !value.label || value.label !== value.id) {
      return
    }
    const unresolvedValue = value

    let active = true

    async function resolveSelectedLabel() {
      const options = await loadCatalogLookupOptions(resource, unresolvedValue.id, 1, 20)
      const match = options.find((option) => option.id === unresolvedValue.id && option.label !== unresolvedValue.id)
      if (active && match) {
        onChange(match)
      }
    }

    void resolveSelectedLabel()

    return () => {
      active = false
    }
  }, [onChange, resource, value])

  return (
    <LookupSelect<LookupOption>
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      loadOptions={(query, page, perPage) => loadCatalogLookupOptions(resource, query, page, perPage)}
    />
  )
}
