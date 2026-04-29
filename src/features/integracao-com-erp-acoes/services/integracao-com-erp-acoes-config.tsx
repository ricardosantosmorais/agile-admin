import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { loadErpCatalogLookup } from '@/src/lib/erp-catalog-lookups'
import { ACAO_TYPE_OPTIONS, buildAcaoPayload, normalizeAcaoRecord } from '@/src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes'

function wrap(value: unknown) {
	return <span className="block whitespace-normal leading-snug [overflow-wrap:anywhere]">{String(value || '-')}</span>
}

export const INTEGRACAO_COM_ERP_ACOES_CONFIG: CrudModuleConfig = {
	key: 'integracao-com-erp-acoes',
	resource: 'acoes',
	routeBase: '/integracao-com-erp/cadastros/acoes',
	featureKey: 'erpCadastrosAcoes',
	listTitleKey: 'maintenance.erpIntegration.catalogs.items.acoes.title',
	listTitle: 'Ações',
	listDescriptionKey: 'maintenance.erpIntegration.catalogs.items.acoes.listDescription',
	listDescription: 'Gerencie ações executadas por scripts, gateways e serviços.',
	formTitleKey: 'maintenance.erpIntegration.catalogs.items.acoes.formTitle',
	formTitle: 'Ação',
	breadcrumbParents: [{ labelKey: 'menuKeys.integracao-erp', label: 'Integração com ERP', href: '/integracao-com-erp/dashboard' }],
	breadcrumbSectionKey: 'menuKeys.integracao-erp-cadastros-list',
	breadcrumbSection: 'Cadastros',
	breadcrumbSectionHref: '/integracao-com-erp/cadastros',
	breadcrumbModuleKey: 'maintenance.erpIntegration.catalogs.items.acoes.title',
	breadcrumbModule: 'Ações',
	defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', 'nome::lk': '', tipo: '', id_template: '', id_gateway: '', ativo: '' },
	columns: [
		{ id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[80px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
		{ id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-[color:var(--app-text)]', render: (record) => wrap(record.nome), filter: { kind: 'text', key: 'nome::lk' } },
		{ id: 'tipo', labelKey: 'maintenance.erpIntegration.catalogs.items.acoes.fields.type', label: 'Tipo', sortKey: 'tipo', render: (record) => <StatusBadge tone="neutral">{String(record.tipo || '-')}</StatusBadge>, filter: { kind: 'select', key: 'tipo', options: [...ACAO_TYPE_OPTIONS] } },
		{ id: 'templates.nome', labelKey: 'maintenance.erpIntegration.catalogs.items.templates.title', label: 'Template', sortKey: 'templates.nome', render: (record) => wrap(record.template_nome || record['templates.nome']), filter: { kind: 'lookup', key: 'id_template', loadOptions: (q, p, pp) => loadErpCatalogLookup('templates', q, p, pp) } },
		{ id: 'gateways.nome', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.title', label: 'Gateway', sortKey: 'gateways.nome', render: (record) => wrap(record.gateway_nome || record['gateways.nome']), filter: { kind: 'lookup', key: 'id_gateway', loadOptions: (q, p, pp) => loadErpCatalogLookup('gateways', q, p, pp) } },
		{ id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[110px]', render: (record) => <StatusBadge tone={record.ativo ? 'success' : 'warning'}>{record.ativo ? 'Sim' : 'Não'}</StatusBadge>, filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
	],
	mobileTitle: (record) => String(record.nome || '-'),
	mobileSubtitle: (record) => String(record.tipo || '-'),
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
				{ key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
				{ key: 'tipo', labelKey: 'maintenance.erpIntegration.catalogs.items.acoes.fields.type', label: 'Tipo', type: 'select', required: true, options: [...ACAO_TYPE_OPTIONS] },
				{ key: 'id_template', labelKey: 'maintenance.erpIntegration.catalogs.items.templates.title', label: 'Template', type: 'lookup', required: true, optionsResource: 'templates' },
				{ key: 'id_gateway', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.title', label: 'Gateway', type: 'lookup', required: true, optionsResource: 'gateways' },
				{ key: 'objeto', labelKey: 'maintenance.erpIntegration.catalogs.items.acoes.fields.object', label: 'Objeto', type: 'textarea', rows: 4 },
				{ key: 'url_filtro', labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.fields.urlFilter', label: 'URL filtro', type: 'textarea', rows: 4 },
			],
		},
	],
	normalizeRecord: normalizeAcaoRecord,
	beforeSave: buildAcaoPayload,
}
