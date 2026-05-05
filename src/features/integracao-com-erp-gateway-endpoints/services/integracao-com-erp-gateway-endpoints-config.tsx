import { StatusBadge } from '@/src/components/ui/status-badge'
import { JsonCodeEditor } from '@/src/components/ui/json-code-editor'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { buildGatewayEndpointPayload, GATEWAY_ENDPOINT_PAGINATION_OPTIONS, GATEWAY_ENDPOINT_TYPE_OPTIONS, GATEWAY_ENDPOINT_VERB_OPTIONS, normalizeGatewayEndpointRecord } from '@/src/features/integracao-com-erp-gateway-endpoints/services/integracao-com-erp-gateway-endpoints'

function wrap(value: unknown) {
	return <span className="block whitespace-normal leading-snug [overflow-wrap:anywhere]">{String(value || '-')}</span>
}

export const INTEGRACAO_COM_ERP_GATEWAY_ENDPOINTS_CONFIG: CrudModuleConfig = {
	key: 'integracao-com-erp-gateway-endpoints',
	resource: 'gateways_endpoints',
	routeBase: '/integracao-com-erp/cadastros/gateway-endpoints',
	featureKey: 'erpCadastrosGatewayEndpoints',
	listTitleKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.title',
	listTitle: 'Gateway Endpoints',
	listDescriptionKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.listDescription',
	listDescription: 'Gerencie endpoints vinculados aos gateways externos.',
	formTitleKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.formTitle',
	formTitle: 'Gateway Endpoint',
	breadcrumbParents: [{ labelKey: 'menuKeys.integracao-erp', label: 'Integração com ERP', href: '/integracao-com-erp/dashboard' }],
	breadcrumbSectionKey: 'menuKeys.integracao-erp-cadastros-list',
	breadcrumbSection: 'Cadastros',
	breadcrumbSectionHref: '/integracao-com-erp/cadastros',
	breadcrumbModuleKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.title',
	breadcrumbModule: 'Gateway Endpoints',
	defaultFilters: { page: 1, perPage: 15, orderBy: 'endpoint', sort: 'asc', id: '', id_gateway: '', 'endpoint::lk': '', verbo: '' },
	columns: [
		{ id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[80px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
		{ id: 'gateways.nome', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.title', label: 'Gateway', sortKey: 'gateways.nome', render: (record) => wrap(record.gateway_nome || record['gateways.nome']), filter: { kind: 'lookup', key: 'id_gateway', loadOptions: async (q, p, pp) => (await import('@/src/lib/erp-catalog-lookups')).loadErpCatalogLookup('gateways', q, p, pp) } },
		{ id: 'endpoint', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.endpoint', label: 'Endpoint', sortKey: 'endpoint', tdClassName: 'font-semibold text-[color:var(--app-text)]', render: (record) => wrap(record.endpoint), filter: { kind: 'text', key: 'endpoint::lk' } },
		{ id: 'verbo', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.verb', label: 'Verbo', sortKey: 'verbo', thClassName: 'w-[120px]', render: (record) => <StatusBadge tone="info">{String(record.verbo || '-').toUpperCase()}</StatusBadge>, filter: { kind: 'select', key: 'verbo', options: GATEWAY_ENDPOINT_VERB_OPTIONS.map((value) => ({ value, label: value.toUpperCase() })) } },
	],
	mobileTitle: (record) => String(record.endpoint || '-'),
	mobileSubtitle: (record) => String(record.gateway_nome || record['gateways.nome'] || '-'),
	renderMobileBadges: (record) => <StatusBadge tone="info">{String(record.verbo || '-').toUpperCase()}</StatusBadge>,
	selectable: false,
	canDeleteRow: () => false,
	sections: [
		{
			id: 'main',
			titleKey: 'simpleCrud.sections.main',
			title: 'Dados principais',
			layout: 'rows',
			fields: [
				{ key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true },
				{ key: 'id_gateway', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.title', label: 'Gateway', type: 'lookup', optionsResource: 'gateways', required: true },
				{ key: 'endpoint', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.endpoint', label: 'Endpoint', type: 'text', required: true, maxLength: 255 },
				{ key: 'verbo', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.verb', label: 'Verbo', type: 'select', required: true, options: GATEWAY_ENDPOINT_VERB_OPTIONS.map((value) => ({ value, label: value.toUpperCase() })) },
				{ key: 'tipo', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.type', label: 'Tipo', type: 'select', options: [...GATEWAY_ENDPOINT_TYPE_OPTIONS] },
				{ key: 'url_filtro', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.urlFilter', label: 'URL filtro', type: 'text' },
				{ key: 'body', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.body', label: 'Body', type: 'custom', render: ({ value, patch, readOnly, disabled }) => <JsonCodeEditor id="gateway-endpoint-body" value={String(value ?? '')} onChange={(next) => patch('body', next)} readOnly={readOnly || disabled} height="420px" /> },
				{ key: 'parametros', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.params', label: 'Parâmetros', type: 'custom', render: ({ value, patch, readOnly, disabled }) => <JsonCodeEditor id="gateway-endpoint-parametros" value={String(value ?? '')} onChange={(next) => patch('parametros', next)} readOnly={readOnly || disabled} height="260px" /> },
				{ key: 'data_array', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.dataArray', label: 'Data array', type: 'text' },
			],
		},
		{
			id: 'pagination',
			titleKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.sections.pagination',
			title: 'Paginação e expiração',
			layout: 'rows',
			fields: [
				{ key: 'tipo_paginacao', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.paginationType', label: 'Tipo de paginação', type: 'select', options: [...GATEWAY_ENDPOINT_PAGINATION_OPTIONS] },
				{ key: 'nome_propriedade_pagina', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.pageProperty', label: 'Propriedade página', type: 'text' },
				{ key: 'nome_propriedade_por_pagina', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.perPageProperty', label: 'Propriedade por página', type: 'text' },
				{ key: 'quantidade_por_pagina', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.perPageQuantity', label: 'Quantidade por página', type: 'number' },
				{ key: 'nome_retorno_pagina_atual', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.currentPageReturn', label: 'Retorno página atual', type: 'text' },
				{ key: 'nome_retorno_total_paginas', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.totalPagesReturn', label: 'Retorno total páginas', type: 'text' },
				{ key: 'token_campo', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.tokenField', label: 'Campo token', type: 'text' },
				{ key: 'expiracao_campo', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.expirationField', label: 'Campo expiração', type: 'text' },
				{ key: 'expiracao_tempo', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.expirationTime', label: 'Tempo expiração', type: 'number' },
				{ key: 'expiracao_formato', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.expirationFormat', label: 'Formato expiração', type: 'text' },
			],
		},
	],
	normalizeRecord: normalizeGatewayEndpointRecord,
	beforeSave: buildGatewayEndpointPayload,
}
