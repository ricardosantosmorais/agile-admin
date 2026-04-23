'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { integracaoComErpErpsClient } from '@/src/features/integracao-com-erp-erps/services/integracao-com-erp-erps-client'
import { INTEGRACAO_COM_ERP_ERPS_CONFIG } from '@/src/features/integracao-com-erp-erps/services/integracao-com-erp-erps-config'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

export function IntegracaoComErpErpsListPage() {
	const { session } = useAuth()
	const { t } = useI18n()

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.erps.title', 'ERPs')} backHref="/dashboard" />
	}

	return <CrudListPage config={INTEGRACAO_COM_ERP_ERPS_CONFIG} client={integracaoComErpErpsClient} />
}
