'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { integracaoComErpScriptsClient } from '@/src/features/integracao-com-erp-scripts/services/integracao-com-erp-scripts-client'
import { INTEGRACAO_COM_ERP_SCRIPTS_CONFIG } from '@/src/features/integracao-com-erp-scripts/services/integracao-com-erp-scripts-config'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

export function IntegracaoComErpScriptsListPage() {
	const { session } = useAuth()
	const { t } = useI18n()

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.scripts.title', 'Scripts')} backHref="/dashboard" />
	}

	return <CrudListPage config={INTEGRACAO_COM_ERP_SCRIPTS_CONFIG} client={integracaoComErpScriptsClient} />
}
