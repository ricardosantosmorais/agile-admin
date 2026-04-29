'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG } from '@/src/features/integracao-com-erp-interfaces-consulta/services/integracao-com-erp-interfaces-consulta-config'
import { integracaoComErpInterfacesConsultaClient } from '@/src/features/integracao-com-erp-interfaces-consulta/services/integracao-com-erp-interfaces-consulta-client'

export function IntegracaoComErpInterfacesConsultaListPage() {
	return <CrudListPage config={INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG} client={integracaoComErpInterfacesConsultaClient} />
}
