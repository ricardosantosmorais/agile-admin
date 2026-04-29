'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { INTEGRACAO_COM_ERP_ACOES_CONFIG } from '@/src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes-config'
import { integracaoComErpAcoesClient } from '@/src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes-client'

export function IntegracaoComErpAcoesListPage() {
	return <CrudListPage config={INTEGRACAO_COM_ERP_ACOES_CONFIG} client={integracaoComErpAcoesClient} />
}
