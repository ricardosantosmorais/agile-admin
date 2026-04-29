'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { INTEGRACAO_COM_ERP_GATEWAYS_CONFIG } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways-config'
import { integracaoComErpGatewaysClient } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways-client'

export function IntegracaoComErpGatewaysFormPage({ id }: { id?: string }) {
	return <CrudFormPage config={INTEGRACAO_COM_ERP_GATEWAYS_CONFIG} client={integracaoComErpGatewaysClient} id={id} />
}
