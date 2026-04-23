'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { integracaoComErpParametrosGrupoClient } from '@/src/features/integracao-com-erp-parametros-grupo/services/integracao-com-erp-parametros-grupo-client'
import { INTEGRACAO_COM_ERP_PARAMETROS_GRUPO_CONFIG } from '@/src/features/integracao-com-erp-parametros-grupo/services/integracao-com-erp-parametros-grupo-config'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

export function IntegracaoComErpParametrosGrupoFormPage({ id }: { id?: string }) {
	const { session } = useAuth()
	const { t } = useI18n()

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.parametrosGrupo.formTitle', 'Parâmetros Grupo')} backHref="/integracao-com-erp/cadastros/parametros-grupo" />
	}

	return <CrudFormPage config={INTEGRACAO_COM_ERP_PARAMETROS_GRUPO_CONFIG} client={integracaoComErpParametrosGrupoClient} id={id} />
}
