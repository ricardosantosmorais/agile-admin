'use client';

import { ModuleFoundationPage } from '@/src/components/ui/module-foundation-page';
import { useI18n } from '@/src/i18n/use-i18n';

export function IntegracaoComErpServicosWizardPage() {
	const { t } = useI18n();

	return (
		<ModuleFoundationPage
			title={t('maintenance.erpIntegration.modules.servicesWizard.title', 'Criar Serviço')}
			description={t(
				'maintenance.erpIntegration.modules.servicesWizard.description',
				'Base protegida para o wizard de criação de serviços do integrador ERP, com definição de escopo, tipo, cadastros auxiliares e revisão final.',
			)}
			featureKey="erpServicos"
			legacyComponent="servicos-integracao-wizard-form"
			breadcrumbLabel={t('maintenance.erpIntegration.modules.servicesWizard.title', 'Criar Serviço')}
			moduleSectionLabel={t('maintenance.erpIntegration.modules.services.title', 'Serviços')}
			moduleSectionPath="/integracao-com-erp/servicos"
			backHref="/integracao-com-erp/servicos"
		/>
	);
}
