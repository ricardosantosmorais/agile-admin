'use client'

import { Building2, Link2 } from 'lucide-react'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { FuncionalidadeEmpresasTab } from '@/src/features/funcionalidades/components/funcionalidade-empresas-tab'
import { funcionalidadesClient } from '@/src/features/funcionalidades/services/funcionalidades-client'
import { FUNCIONALIDADES_CONFIG } from '@/src/features/funcionalidades/services/funcionalidades-config'
import { useI18n } from '@/src/i18n/use-i18n'

export function FuncionalidadeFormPage({ id }: { id?: string }) {
	const { t } = useI18n()

	return (
		<TabbedCatalogFormPage
			config={FUNCIONALIDADES_CONFIG}
			client={funcionalidadesClient}
			id={id}
			tabs={[
				{
					key: 'dados',
					label: t('basicRegistrations.sections.general', 'Dados gerais'),
					icon: <Link2 className="h-4 w-4" />,
					sectionIds: ['main'],
				},
				{
					key: 'empresas',
					label: t('registrations.features.companies.title', 'Empresas'),
					icon: <Building2 className="h-4 w-4" />,
					hidden: ({ isEditing }) => !isEditing,
					render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => (
						<FuncionalidadeEmpresasTab
							id={recordId}
							form={form}
							readOnly={readOnly}
							refreshRecord={refreshRecord}
							onFeedback={onFeedback}
						/>
					),
				},
			]}
		/>
	)
}
