'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { INTEGRACAO_COM_ERP_GATEWAYS_CONFIG } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways-config'
import { integracaoComErpGatewaysClient } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways-client'

export function IntegracaoComErpGatewaysListPage() {
	return <CrudListPage config={INTEGRACAO_COM_ERP_GATEWAYS_CONFIG} client={integracaoComErpGatewaysClient} />
}
