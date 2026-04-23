'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { integracaoComErpParametrosCadastroClient } from '@/src/features/integracao-com-erp-parametros-cadastro/services/integracao-com-erp-parametros-cadastro-client'
import { INTEGRACAO_COM_ERP_PARAMETROS_CADASTRO_CONFIG } from '@/src/features/integracao-com-erp-parametros-cadastro/services/integracao-com-erp-parametros-cadastro-config'
import { useI18n } from '@/src/i18n/use-i18n'
import { isRootAgileecommerceAdmin } from '@/src/lib/root-tenant'

export function IntegracaoComErpParametrosCadastroFormPage({ id }: { id?: string }) {
	const { session } = useAuth()
	const { t } = useI18n()

	if (!isRootAgileecommerceAdmin(session)) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.catalogs.items.parametrosCadastro.formTitle', 'Parâmetro Cadastro')} backHref="/integracao-com-erp/cadastros/parametros-cadastro" />
	}

	return <CrudFormPage config={INTEGRACAO_COM_ERP_PARAMETROS_CADASTRO_CONFIG} client={integracaoComErpParametrosCadastroClient} id={id} />
}
