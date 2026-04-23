'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { integracaoComErpQueriesClient } from '@/src/features/integracao-com-erp-queries/services/integracao-com-erp-queries-client'
import { INTEGRACAO_COM_ERP_QUERIES_CONFIG } from '@/src/features/integracao-com-erp-queries/services/integracao-com-erp-queries-config'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

export function IntegracaoComErpQueriesListPage() {
	const { session } = useAuth()
	const { t } = useI18n()

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.queries.title', 'Queries')} backHref="/dashboard" />
	}

	return <CrudListPage config={INTEGRACAO_COM_ERP_QUERIES_CONFIG} client={integracaoComErpQueriesClient} />
}
