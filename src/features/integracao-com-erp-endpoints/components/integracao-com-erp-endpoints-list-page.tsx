'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { INTEGRACAO_COM_ERP_ENDPOINTS_CONFIG } from '@/src/features/integracao-com-erp-endpoints/services/integracao-com-erp-endpoints-config'

const client = createCrudClient('/api/endpoints')

export function IntegracaoComErpEndpointsListPage() {
	return <CrudListPage config={INTEGRACAO_COM_ERP_ENDPOINTS_CONFIG} client={client} />
}
