'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { integracaoComErpParametrosGrupoClient } from '@/src/features/integracao-com-erp-parametros-grupo/services/integracao-com-erp-parametros-grupo-client'
import { INTEGRACAO_COM_ERP_PARAMETROS_GRUPO_CONFIG } from '@/src/features/integracao-com-erp-parametros-grupo/services/integracao-com-erp-parametros-grupo-config'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

export function IntegracaoComErpParametrosGrupoListPage() {
	const { session } = useAuth()
	const { t } = useI18n()

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.parametrosGrupo.title', 'Parâmetros Grupo')} backHref="/dashboard" />
	}

	return <CrudListPage config={INTEGRACAO_COM_ERP_PARAMETROS_GRUPO_CONFIG} client={integracaoComErpParametrosGrupoClient} />
}
