'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { INTEGRACAO_COM_ERP_CADASTRO_SERVICOS_CONFIG } from '@/src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos-config'
import { integracaoComErpCadastroServicosClient } from '@/src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos-client'

export function IntegracaoComErpCadastroServicosListPage() {
	return <CrudListPage config={INTEGRACAO_COM_ERP_CADASTRO_SERVICOS_CONFIG} client={integracaoComErpCadastroServicosClient} />
}
