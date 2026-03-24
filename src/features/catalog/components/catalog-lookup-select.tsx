'use client'

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
