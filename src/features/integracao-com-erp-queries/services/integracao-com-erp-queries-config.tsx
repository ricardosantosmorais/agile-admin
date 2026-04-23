import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { buildQueryPayload, loadQueryTemplateOptions, normalizeQueryRecord } from '@/src/features/integracao-com-erp-queries/services/integracao-com-erp-queries'

function renderBooleanBadge(value: unknown) {
	const active = value === true || value === 1 || value === '1' || value === 'true'
	return <StatusBadge tone={active ? 'success' : 'warning'}>{active ? 'Sim' : 'Não'}</StatusBadge>
}

function renderText(value: unknown) {
	return <span className="block whitespace-normal leading-snug [overflow-wrap:anywhere]">{String(value || '-')}</span>
}

export const INTEGRACAO_COM_ERP_QUERIES_CONFIG: CrudModuleConfig = {
	key: 'integracao-com-erp-queries',
	resource: 'querys',
	routeBase: '/integracao-com-erp/cadastros/queries',
	featureKey: 'erpCadastrosQueries',
	listTitleKey: 'maintenance.erpIntegration.catalogs.items.queries.title',
	listTitle: 'Queries',
	listDescriptionKey: 'maintenance.erpIntegration.catalogs.items.queries.listDescription',
	listDescription: 'Gerencie as consultas SQL reutilizadas pelos fluxos de integração com ERP.',
	formTitleKey: 'maintenance.erpIntegration.catalogs.items.queries.formTitle',
	formTitle: 'Query',
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
	breadcrumbModuleKey: 'maintenance.erpIntegration.catalogs.items.queries.title',
	breadcrumbModule: 'Queries',
	defaultFilters: {
		page: 1,
		perPage: 15,
		orderBy: 'nome',
		sort: 'asc',
		id: '',
		'nome::lk': '',
		'template_nome::lk': '',
		id_template: '',
		ativo: '',
	},
	columns: [
		{ id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[72px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
		{
			id: 'nome',
			labelKey: 'simpleCrud.fields.name',
			label: 'Nome',
			sortKey: 'nome',
			thClassName: 'min-w-0',
			tdClassName: 'font-semibold text-[color:var(--app-text)]',
			render: (record) => renderText(record.nome),
			filter: { kind: 'text', key: 'nome::lk' },
		},
		{
			id: 'template_nome',
			labelKey: 'maintenance.erpIntegration.catalogs.items.queries.fields.template',
			label: 'Template',
			sortKey: 'template_nome',
			thClassName: 'w-[220px]',
			tdClassName: 'whitespace-normal',
			render: (record) => renderText(record.template_nome || record['templates.nome'] || record.id_template),
			filter: { kind: 'lookup', key: 'id_template', loadOptions: loadQueryTemplateOptions, pageSize: 30 },
		},
		{
			id: 'ativo',
			labelKey: 'simpleCrud.fields.active',
			label: 'Ativo',
			sortKey: 'ativo',
			thClassName: 'w-[90px]',
			render: (record) => renderBooleanBadge(record.ativo),
			filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] },
		},
	],
	mobileTitle: (record) => String(record.nome || '-'),
	mobileSubtitle: (record) => `Template: ${String(record.template_nome || record.id_template || '-')}`,
	renderMobileBadges: (record) => renderBooleanBadge(record.ativo),
	selectable: false,
	canDeleteRow: () => false,
	sections: [],
	normalizeRecord: normalizeQueryRecord,
	beforeSave: buildQueryPayload,
}
