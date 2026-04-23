'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { integracaoComErpTemplatesClient } from '@/src/features/integracao-com-erp-templates/services/integracao-com-erp-templates-client'
import { INTEGRACAO_COM_ERP_TEMPLATES_CONFIG } from '@/src/features/integracao-com-erp-templates/services/integracao-com-erp-templates-config'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

export function IntegracaoComErpTemplatesFormPage({ id }: { id?: string }) {
	const { session } = useAuth()
	const { t } = useI18n()

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.templates.formTitle', 'Template')} backHref="/integracao-com-erp/cadastros/templates" />
	}

	return <CrudFormPage config={INTEGRACAO_COM_ERP_TEMPLATES_CONFIG} client={integracaoComErpTemplatesClient} id={id} />
}
