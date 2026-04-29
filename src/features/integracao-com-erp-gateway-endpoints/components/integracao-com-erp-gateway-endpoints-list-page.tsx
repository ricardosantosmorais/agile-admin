'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { INTEGRACAO_COM_ERP_GATEWAY_ENDPOINTS_CONFIG } from '@/src/features/integracao-com-erp-gateway-endpoints/services/integracao-com-erp-gateway-endpoints-config'
import { integracaoComErpGatewayEndpointsClient } from '@/src/features/integracao-com-erp-gateway-endpoints/services/integracao-com-erp-gateway-endpoints-client'

export function IntegracaoComErpGatewayEndpointsListPage() {
	return <CrudListPage config={INTEGRACAO_COM_ERP_GATEWAY_ENDPOINTS_CONFIG} client={integracaoComErpGatewayEndpointsClient} />
}
