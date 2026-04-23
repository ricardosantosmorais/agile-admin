import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { loadTemplateErpOptions, buildTemplatePayload, normalizeTemplateRecord } from '@/src/features/integracao-com-erp-templates/services/integracao-com-erp-templates'

function renderErpLabel(record: CrudRecord) {
	const lookup = typeof record.id_erp_lookup === 'object' && record.id_erp_lookup !== null
		? record.id_erp_lookup as { label?: unknown }
		: null
	const label = String(record['erps.nome'] ?? lookup?.label ?? '').trim()
	return label || '-'
}

export const INTEGRACAO_COM_ERP_TEMPLATES_CONFIG: CrudModuleConfig = {
	key: 'integracao-com-erp-templates',
	resource: 'templates',
	routeBase: '/integracao-com-erp/cadastros/templates',
	featureKey: 'erpCadastrosTemplates',
	listTitleKey: 'maintenance.erpIntegration.catalogs.items.templates.title',
	listTitle: 'Templates',
	listDescriptionKey: 'maintenance.erpIntegration.catalogs.items.templates.listDescription',
	listDescription: 'Gerencie os templates usados pelos cadastros e serviços de integração.',
	formTitleKey: 'maintenance.erpIntegration.catalogs.items.templates.formTitle',
	formTitle: 'Template',
	breadcrumbParents: [
		{
			labelKey: 'menuKeys.integracao-erp',
			label: 'Integração com ERP',
			href: '/integracao-com-erp/dashboard',
		},
	],
	breadcrumbSectionKey: 'menuKeys.integracao-erp-cadastros-list',
	breadcrumbSection: 'Cadastros',
	breadcrumbSectionHref: '/integracao-com-erp/cadastros',
	breadcrumbModuleKey: 'maintenance.erpIntegration.catalogs.items.templates.title',
	breadcrumbModule: 'Templates',
	defaultFilters: {
		page: 1,
		perPage: 15,
		orderBy: 'erps.nome',
		sort: 'asc',
		id: '',
		id_erp: '',
		'codigo::lk': '',
		'nome::lk': '',
	},
	columns: [
		{
			id: 'id',
			labelKey: 'simpleCrud.fields.id',
			label: 'ID',
			sortKey: 'id',
			thClassName: 'w-[90px]',
			filter: { kind: 'text', key: 'id', inputMode: 'numeric' },
		},
		{
			id: 'erps.nome',
			labelKey: 'rootCompanies.fields.erp',
			label: 'ERP',
			sortKey: 'erps.nome',
			thClassName: 'w-[180px]',
			render: (record) => <span className="truncate">{renderErpLabel(record)}</span>,
			filter: {
				kind: 'lookup',
				key: 'id_erp',
				loadOptions: loadTemplateErpOptions,
				pageSize: 30,
			},
		},
		{
			id: 'codigo',
			labelKey: 'simpleCrud.fields.code',
			label: 'Código',
			sortKey: 'codigo',
			thClassName: 'w-[180px]',
			filter: { kind: 'text', key: 'codigo::lk' },
		},
		{
			id: 'nome',
			labelKey: 'simpleCrud.fields.name',
			label: 'Nome',
			sortKey: 'nome',
			tdClassName: 'font-semibold text-[color:var(--app-text)]',
			filter: { kind: 'text', key: 'nome::lk' },
		},
	],
	mobileTitle: (record) => String(record.nome || '-'),
	mobileSubtitle: (record) => String(record.codigo || '-'),
	mobileMeta: (record) => renderErpLabel(record),
	selectable: false,
	canDeleteRow: () => false,
	sections: [
		{
			id: 'main',
			titleKey: 'simpleCrud.sections.main',
			title: 'Dados principais',
			layout: 'rows',
			fields: [
				{
					key: 'id_erp',
					labelKey: 'rootCompanies.fields.erp',
					label: 'ERP',
					type: 'lookup',
					optionsResource: 'erps',
					required: true,
				},
				{ key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text', required: true, maxLength: 50 },
				{ key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
			],
		},
	],
	normalizeRecord: normalizeTemplateRecord,
	beforeSave: buildTemplatePayload,
}
