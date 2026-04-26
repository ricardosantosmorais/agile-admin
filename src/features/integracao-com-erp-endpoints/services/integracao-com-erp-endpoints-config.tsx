import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import {
	buildEndpointPayload,
	ENDPOINT_RETURN_TYPE_OPTIONS,
	getEndpointReturnTypeLabel,
	normalizeEndpointRecord,
} from '@/src/features/integracao-com-erp-endpoints/services/integracao-com-erp-endpoints'

function renderWrapped(value: unknown, className = '') {
	return <span className={`block whitespace-normal leading-snug [overflow-wrap:anywhere] ${className}`}>{String(value || '-')}</span>
}

function renderBooleanBadge(value: unknown) {
	const active = value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
	return <StatusBadge tone={active ? 'success' : 'warning'}>{active ? 'Sim' : 'Não'}</StatusBadge>
}

export const INTEGRACAO_COM_ERP_ENDPOINTS_CONFIG: CrudModuleConfig = {
	key: 'integracao-com-erp-endpoints',
	resource: 'endpoints',
	routeBase: '/integracao-com-erp/cadastros/endpoints',
	featureKey: 'erpCadastrosEndpoints',
	listTitleKey: 'maintenance.erpIntegration.catalogs.items.endpoints.title',
	listTitle: 'Endpoints',
	listDescriptionKey: 'maintenance.erpIntegration.catalogs.items.endpoints.listDescription',
	listDescription: 'Gerencie endpoints de integração usados pelos serviços e gateways.',
	formTitleKey: 'maintenance.erpIntegration.catalogs.items.endpoints.formTitle',
	formTitle: 'Endpoint',
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
	breadcrumbModuleKey: 'maintenance.erpIntegration.catalogs.items.endpoints.title',
	breadcrumbModule: 'Endpoints',
	defaultFilters: {
		page: 1,
		perPage: 15,
		orderBy: 'id',
		sort: 'asc',
		id: '',
		'nome::lk': '',
		'tipo_retorno::lk': '',
		publico: '',
		ativo: '',
	},
	columns: [
		{ id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[84px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
		{
			id: 'nome',
			labelKey: 'simpleCrud.fields.name',
			label: 'Nome',
			sortKey: 'nome',
			thClassName: 'min-w-0',
			tdClassName: 'font-semibold text-[color:var(--app-text)]',
			render: (record) => renderWrapped(record.nome),
			filter: { kind: 'text', key: 'nome::lk' },
		},
		{
			id: 'tipo_retorno',
			labelKey: 'maintenance.erpIntegration.catalogs.items.endpoints.fields.returnType',
			label: 'Tipo de Retorno',
			sortKey: 'tipo_retorno',
			visibility: 'lg',
			thClassName: 'w-[180px]',
			render: (record) => <StatusBadge tone="neutral">{getEndpointReturnTypeLabel(record.tipo_retorno)}</StatusBadge>,
			filter: {
				kind: 'select',
				key: 'tipo_retorno::lk',
				options: ENDPOINT_RETURN_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
			},
		},
		{
			id: 'publico',
			labelKey: 'maintenance.erpIntegration.catalogs.items.endpoints.fields.public',
			label: 'Público',
			sortKey: 'publico',
			visibility: 'xl',
			thClassName: 'w-[120px]',
			render: (record) => renderBooleanBadge(record.publico),
			filter: {
				kind: 'select',
				key: 'publico',
				options: [
					{ value: '1', label: 'Sim' },
					{ value: '0', label: 'Não' },
				],
			},
		},
		{
			id: 'ativo',
			labelKey: 'simpleCrud.fields.active',
			label: 'Ativo',
			sortKey: 'ativo',
			thClassName: 'w-[110px]',
			render: (record) => renderBooleanBadge(record.ativo),
			filter: {
				kind: 'select',
				key: 'ativo',
				options: [
					{ value: '1', label: 'Sim' },
					{ value: '0', label: 'Não' },
				],
			},
		},
	],
	mobileTitle: (record) => String(record.nome || '-'),
	mobileSubtitle: (record) => `Tipo de Retorno: ${getEndpointReturnTypeLabel(record.tipo_retorno)}`,
	renderMobileBadges: (record) => (
		<>
			{renderBooleanBadge(record.publico)}
			{renderBooleanBadge(record.ativo)}
		</>
	),
	selectable: false,
	canDeleteRow: () => false,
	sections: [],
	normalizeRecord: normalizeEndpointRecord,
	beforeSave: buildEndpointPayload,
}
