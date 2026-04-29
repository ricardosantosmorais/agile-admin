import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { buildInterfaceConsultaPayload, INTERFACE_SOURCE_TYPE_OPTIONS, normalizeInterfaceConsultaRecord } from '@/src/features/integracao-com-erp-interfaces-consulta/services/integracao-com-erp-interfaces-consulta'

function wrap(value: unknown) {
	return <span className="block whitespace-normal leading-snug [overflow-wrap:anywhere]">{String(value || '-')}</span>
}

export const INTEGRACAO_COM_ERP_INTERFACES_CONSULTA_CONFIG: CrudModuleConfig = {
	key: 'integracao-com-erp-interfaces-consulta',
	resource: 'interfaces_consulta',
	routeBase: '/integracao-com-erp/cadastros/interfaces-consulta',
	featureKey: 'erpCadastrosInterfacesConsulta',
	listTitleKey: 'maintenance.erpIntegration.catalogs.items.interfacesConsulta.title',
	listTitle: 'Interfaces de Consulta',
	listDescriptionKey: 'maintenance.erpIntegration.catalogs.items.interfacesConsulta.listDescription',
	listDescription: 'Configure as interfaces de consulta, vínculos por template e fonte de resolução.',
	formTitleKey: 'maintenance.erpIntegration.catalogs.items.interfacesConsulta.formTitle',
	formTitle: 'Interface de Consulta',
	breadcrumbParents: [{ labelKey: 'menuKeys.integracao-erp', label: 'Integração com ERP', href: '/integracao-com-erp/dashboard' }],
	breadcrumbSectionKey: 'menuKeys.integracao-erp-cadastros-list',
	breadcrumbSection: 'Cadastros',
	breadcrumbSectionHref: '/integracao-com-erp/cadastros',
	breadcrumbModuleKey: 'maintenance.erpIntegration.catalogs.items.interfacesConsulta.title',
	breadcrumbModule: 'Interfaces de Consulta',
	defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', 'nome::lk': '' },
	columns: [
		{ id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[90px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
		{ id: 'nome', labelKey: 'maintenance.erpIntegration.catalogs.items.interfacesConsulta.fields.interface', label: 'Interface', sortKey: 'nome', tdClassName: 'font-semibold text-[color:var(--app-text)]', render: (record) => wrap(record.nome), filter: { kind: 'text', key: 'nome::lk' } },
	],
	mobileTitle: (record) => String(record.nome || '-'),
	mobileSubtitle: (record) => `ID #${String(record.id || '-')}`,
	selectable: false,
	canDeleteRow: () => false,
	sections: [
		{
			id: 'main',
			titleKey: 'simpleCrud.sections.main',
			title: 'Dados gerais',
			layout: 'rows',
			fields: [
				{ key: 'id_tabela', labelKey: 'maintenance.erpIntegration.catalogs.items.interfacesConsulta.fields.tableId', label: 'ID da interface', type: 'text', disabled: true },
				{ key: 'nome', labelKey: 'maintenance.erpIntegration.catalogs.items.interfacesConsulta.fields.interface', label: 'Interface', type: 'text', disabled: true },
				{ key: 'tipo_fonte', labelKey: 'maintenance.erpIntegration.catalogs.items.interfacesConsulta.fields.sourceType', label: 'Tipo da fonte', type: 'select', options: [...INTERFACE_SOURCE_TYPE_OPTIONS] },
				{ key: 'id_template', labelKey: 'maintenance.erpIntegration.catalogs.items.templates.title', label: 'Template', type: 'lookup', optionsResource: 'templates' },
				{ key: 'id_query', labelKey: 'maintenance.erpIntegration.catalogs.items.queries.title', label: 'Query', type: 'lookup', optionsResource: 'querys', hidden: ({ form }) => String(form.tipo_fonte || '') !== 'query' },
				{ key: 'id_gateway_endpoint', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.title', label: 'Endpoint Gateway', type: 'lookup', optionsResource: 'gateways_endpoints', hidden: ({ form }) => String(form.tipo_fonte || '') !== 'endpoint_gateway' },
				{ key: 'observacao', labelKey: 'simpleCrud.fields.description', label: 'Observação', type: 'textarea', rows: 4 },
			],
		},
	],
	normalizeRecord: normalizeInterfaceConsultaRecord,
	beforeSave: buildInterfaceConsultaPayload,
}
