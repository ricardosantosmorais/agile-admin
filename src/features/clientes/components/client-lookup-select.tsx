'use client'

import { LookupSelect } from '@/src/components/ui/lookup-select'
import type { ClientLookupOption, ClientLookupResource } from '@/src/features/clientes/types/clientes'
import { appData } from '@/src/services/app-data'

type ClientLookupSelectProps = {
  resource: ClientLookupResource
  label: string
  value: ClientLookupOption | null
  onChange: (value: ClientLookupOption | null) => void
  disabled?: boolean
}

export function ClientLookupSelect({
  resource,
  label,
  value,
  onChange,
  disabled = false,
}: ClientLookupSelectProps) {
  return (
    <LookupSelect<ClientLookupOption>
      label={label}
      value={value}
      onChange={onChange}
      disabled={disabled}
      loadOptions={(query, page, perPage) => appData.clients.lookup(resource, query, page, perPage)}
    />
  )
}
