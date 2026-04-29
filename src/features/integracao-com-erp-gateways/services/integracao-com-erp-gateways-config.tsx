import { StatusBadge } from '@/src/components/ui/status-badge'
import { JsonCodeEditor } from '@/src/components/ui/json-code-editor'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { loadErpCatalogLookup } from '@/src/lib/erp-catalog-lookups'
import { buildGatewayPayload, GATEWAY_ACCESS_OPTIONS, GATEWAY_AUTH_OPTIONS, GATEWAY_VERB_OPTIONS, normalizeGatewayRecord } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways'

function wrap(value: unknown) {
	return <span className="block whitespace-normal leading-snug [overflow-wrap:anywhere]">{String(value || '-')}</span>
}

function templateLabel(record: CrudRecord) {
	return String(record.template_nome || record['templates.nome'] || '-')
}

export const INTEGRACAO_COM_ERP_GATEWAYS_CONFIG: CrudModuleConfig = {
	key: 'integracao-com-erp-gateways',
	resource: 'gateways',
	routeBase: '/integracao-com-erp/cadastros/gateways',
	featureKey: 'erpCadastrosGateways',
	listTitleKey: 'maintenance.erpIntegration.catalogs.items.gateways.title',
	listTitle: 'Gateways',
	listDescriptionKey: 'maintenance.erpIntegration.catalogs.items.gateways.listDescription',
	listDescription: 'Gerencie gateways externos usados por endpoints e serviços da integração.',
	formTitleKey: 'maintenance.erpIntegration.catalogs.items.gateways.formTitle',
	formTitle: 'Gateway',
	breadcrumbParents: [{ labelKey: 'menuKeys.integracao-erp', label: 'Integração com ERP', href: '/integracao-com-erp/dashboard' }],
	breadcrumbSectionKey: 'menuKeys.integracao-erp-cadastros-list',
	breadcrumbSection: 'Cadastros',
	breadcrumbSectionHref: '/integracao-com-erp/cadastros',
	breadcrumbModuleKey: 'maintenance.erpIntegration.catalogs.items.gateways.title',
	breadcrumbModule: 'Gateways',
	defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', 'nome::lk': '', tipo_autenticacao: '', tipo_verbo: '', nivel_acesso: '', id_template: '' },
	columns: [
		{ id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[80px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
		{ id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-[color:var(--app-text)]', render: (record) => wrap(record.nome), filter: { kind: 'text', key: 'nome::lk' } },
		{ id: 'tipo_autenticacao', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.auth', label: 'Autenticação', sortKey: 'tipo_autenticacao', thClassName: 'w-[160px]', render: (record) => <StatusBadge tone="neutral">{String(record.tipo_autenticacao || '-')}</StatusBadge>, filter: { kind: 'select', key: 'tipo_autenticacao', options: GATEWAY_AUTH_OPTIONS.map((value) => ({ value, label: value })) } },
		{ id: 'tipo_verbo', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.verb', label: 'Verbo', sortKey: 'tipo_verbo', thClassName: 'w-[120px]', render: (record) => <StatusBadge tone="info">{String(record.tipo_verbo || '-').toUpperCase()}</StatusBadge>, filter: { kind: 'select', key: 'tipo_verbo', options: GATEWAY_VERB_OPTIONS.map((value) => ({ value, label: value.toUpperCase() })) } },
		{ id: 'nivel_acesso', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.accessLevel', label: 'Nível Acesso', sortKey: 'nivel_acesso', thClassName: 'w-[150px]', render: (record) => <StatusBadge tone={record.nivel_acesso === 'publico' ? 'success' : 'warning'}>{String(record.nivel_acesso || '-')}</StatusBadge>, filter: { kind: 'select', key: 'nivel_acesso', options: [...GATEWAY_ACCESS_OPTIONS] } },
		{ id: 'templates.nome', labelKey: 'maintenance.erpIntegration.catalogs.items.templates.title', label: 'Template', sortKey: 'templates.nome', render: (record) => wrap(templateLabel(record)), filter: { kind: 'lookup', key: 'id_template', loadOptions: (query, page, perPage) => loadErpCatalogLookup('templates', query, page, perPage) } },
	],
	mobileTitle: (record) => String(record.nome || '-'),
	mobileSubtitle: (record) => `${String(record.tipo_autenticacao || '-')} · ${String(record.tipo_verbo || '-').toUpperCase()}`,
	mobileMeta: templateLabel,
	selectable: false,
	canDeleteRow: () => false,
	sections: [
		{
			id: 'main',
			titleKey: 'simpleCrud.sections.main',
			title: 'Dados principais',
			layout: 'rows',
			fields: [
				{ key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
				{ key: 'nivel_acesso', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.accessLevel', label: 'Nível de acesso', type: 'select', required: true, options: [...GATEWAY_ACCESS_OPTIONS] },
				{ key: 'tipo_autenticacao', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.auth', label: 'Tipo de autenticação', type: 'select', required: true, options: GATEWAY_AUTH_OPTIONS.map((value) => ({ value, label: value })) },
				{ key: 'tipo_verbo', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.verb', label: 'Verbo', type: 'select', options: GATEWAY_VERB_OPTIONS.map((value) => ({ value, label: value.toUpperCase() })) },
				{ key: 'id_template', labelKey: 'maintenance.erpIntegration.catalogs.items.templates.title', label: 'Template', type: 'lookup', optionsResource: 'templates' },
				{ key: 'url', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.url', label: 'URL', type: 'textarea', rows: 3 },
			],
		},
		{
			id: 'auth',
			titleKey: 'maintenance.erpIntegration.catalogs.items.gateways.sections.credentials',
			title: 'Credenciais e exemplo',
			layout: 'rows',
			fields: [
				{ key: 'token', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.token', label: 'Token', type: 'text', maxLength: 255 },
				{ key: 'usuario', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.user', label: 'Usuário', type: 'text', maxLength: 255 },
				{ key: 'senha', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.password', label: 'Senha', type: 'text', maxLength: 255 },
				{ key: 'awsaccesskey', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.awsAccessKey', label: 'AWS Access Key', type: 'text', maxLength: 255 },
				{ key: 'awssecretkey', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.awsSecretKey', label: 'AWS Secret Key', type: 'text', maxLength: 255 },
				{ key: 'awsregion', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.awsRegion', label: 'AWS Region', type: 'text', maxLength: 255 },
				{ key: 'awsservicename', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.awsServiceName', label: 'AWS Service Name', type: 'text', maxLength: 255 },
				{ key: 'json_exemplo', labelKey: 'maintenance.erpIntegration.catalogs.items.gateways.fields.jsonExample', label: 'JSON exemplo', type: 'custom', render: ({ value, patch, readOnly, disabled }) => <JsonCodeEditor id="gateway-json-exemplo" value={String(value ?? '')} onChange={(next) => patch('json_exemplo', next)} readOnly={readOnly || disabled} height="320px" /> },
			],
		},
	],
	normalizeRecord: normalizeGatewayRecord,
	beforeSave: buildGatewayPayload,
}
