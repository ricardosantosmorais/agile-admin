import { StatusBadge } from '@/src/components/ui/status-badge'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { ScriptCodeEditor } from '@/src/features/integracao-com-erp-scripts/components/script-code-editor'
import type { CrudModuleConfig, CrudResource } from '@/src/components/crud-base/types'
import { loadErpCatalogLookup } from '@/src/lib/erp-catalog-lookups'
import { httpClient } from '@/src/services/http/http-client'
import {
	buildServicoCadastroPayload,
	normalizeServicoCadastroRecord,
	SERVICO_CHANNEL_OPTIONS,
	SERVICO_DATA_SOURCE_OPTIONS,
	SERVICO_EXECUTION_TYPE_OPTIONS,
	SERVICO_INTERVAL_OPTIONS,
	SERVICO_OBJECT_TYPE_OPTIONS,
	SERVICO_OUTPUT_OPTIONS,
} from '@/src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos'

function wrap(value: unknown) {
	return <span className="block whitespace-normal leading-snug [overflow-wrap:anywhere]">{String(value || '-')}</span>
}

function getObjectLookupResource(tipoObjeto: unknown): CrudResource | null {
	switch (String(tipoObjeto || '')) {
		case 'query':
			return 'querys'
		case 'acao':
			return 'acoes'
		case 'endpoint_gateway':
			return 'gateways_endpoints'
		default:
			return null
	}
}

function optionFromValue(value: unknown, label: unknown): LookupOption | null {
	const id = String(value ?? '').trim()
	if (!id) return null
	return { id, label: String(label || id) }
}

async function loadServicoOptions(path: string, query: string, page: number, perPage: number) {
	const glue = path.includes('?') ? '&' : '?'
	const params = new URLSearchParams({ q: query, page: String(page), perPage: String(perPage) })
	return httpClient<LookupOption[]>(`${path}${glue}${params.toString()}`)
}

export const INTEGRACAO_COM_ERP_CADASTRO_SERVICOS_CONFIG: CrudModuleConfig = {
	key: 'integracao-com-erp-cadastro-servicos',
	resource: 'servicos_cadastros',
	routeBase: '/integracao-com-erp/cadastros/servicos',
	featureKey: 'erpCadastrosServicos',
	listTitleKey: 'maintenance.erpIntegration.catalogs.items.servicos.title',
	listTitle: 'Serviços',
	listDescriptionKey: 'maintenance.erpIntegration.catalogs.items.servicos.listDescription',
	listDescription: 'Gerencie serviços técnicos usados pelas rotinas da integração com ERP.',
	formTitleKey: 'maintenance.erpIntegration.catalogs.items.servicos.formTitle',
	formTitle: 'Serviço',
	breadcrumbParents: [{ labelKey: 'menuKeys.integracao-erp', label: 'Integração com ERP', href: '/integracao-com-erp/dashboard' }],
	breadcrumbSectionKey: 'menuKeys.integracao-erp-cadastros-list',
	breadcrumbSection: 'Cadastros',
	breadcrumbSectionHref: '/integracao-com-erp/cadastros',
	breadcrumbModuleKey: 'maintenance.erpIntegration.catalogs.items.servicos.title',
	breadcrumbModule: 'Serviços',
	defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', 'nome::lk': '', tipo_objeto: '', id_template: '' },
	columns: [
		{ id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[80px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
		{ id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-[color:var(--app-text)]', render: (record) => wrap(record.nome), filter: { kind: 'text', key: 'nome::lk' } },
		{ id: 'tipo_objeto', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.objectType', label: 'Tipo', sortKey: 'tipo_objeto', render: (record) => <StatusBadge tone="neutral">{String(record.tipo_objeto || '-')}</StatusBadge>, filter: { kind: 'select', key: 'tipo_objeto', options: [...SERVICO_OBJECT_TYPE_OPTIONS] } },
		{ id: 'templates.nome', labelKey: 'maintenance.erpIntegration.catalogs.items.templates.title', label: 'Template', sortKey: 'templates.nome', render: (record) => wrap(record.template_nome || record['templates.nome']), filter: { kind: 'lookup', key: 'id_template', loadOptions: (q, p, pp) => loadErpCatalogLookup('templates', q, p, pp) } },
	],
	mobileTitle: (record) => String(record.nome || '-'),
	mobileSubtitle: (record) => String(record.tipo_objeto || '-'),
	selectable: false,
	canDeleteRow: () => false,
	sections: [
		{
			id: 'main',
			titleKey: 'simpleCrud.sections.main',
			title: 'Dados do serviço',
			layout: 'rows',
			fields: [
				{ key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true },
				{ key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome do Serviço', type: 'text', required: true, maxLength: 200 },
				{ key: 'id_template', labelKey: 'maintenance.erpIntegration.catalogs.items.templates.title', label: 'Template', type: 'lookup', optionsResource: 'templates' },
				{ key: 'tipo_objeto', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.objectType', label: 'Tipo do Objeto', type: 'select', options: [...SERVICO_OBJECT_TYPE_OPTIONS] },
				{
					key: 'id_objeto',
					labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.object',
					label: 'Objeto',
					type: 'custom',
					render: ({ value, form, patch, readOnly, disabled }) => {
						const resource = getObjectLookupResource(form.tipo_objeto)
						if (!resource) {
							return <input className="app-input w-full rounded-2xl border border-line/50 bg-transparent px-4 py-3 text-sm" value={String(value || '')} onChange={(event) => patch('id_objeto', event.target.value)} disabled={readOnly || disabled} />
						}
						return (
							<LookupSelect
								label="Objeto"
								value={(form.id_objeto_lookup as LookupOption | null) || optionFromValue(value, form.objeto_nome)}
								loadOptions={(query, page, perPage) => loadServicoOptions(`/api/erp-cadastros/servicos/object-options?tipo_objeto=${encodeURIComponent(String(form.tipo_objeto || ''))}&id_template=${encodeURIComponent(String(form.id_template || ''))}`, query, page, perPage)}
								disabled={readOnly || disabled}
								onChange={(option) => {
									patch('id_objeto', option?.id || '')
									patch('id_objeto_lookup', option)
								}}
							/>
						)
					},
				},
				{
					key: 'nome_objeto',
					labelKey: 'maintenance.erpIntegration.catalogs.items.acoes.fields.objectName',
					label: 'Nome Objeto',
					type: 'custom',
					render: ({ value, patch, readOnly, disabled }) => (
						<LookupSelect
							label="Nome Objeto"
							value={optionFromValue(value, value)}
							loadOptions={(query, page, perPage) => loadServicoOptions('/api/erp-cadastros/servicos/tabelas-options', query, page, perPage)}
							disabled={readOnly || disabled}
							onChange={(option) => patch('nome_objeto', option?.id || '')}
						/>
					),
				},
				{ key: 'fonte_dados', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.dataSource', label: 'Fonte de Dados', type: 'select', options: [...SERVICO_DATA_SOURCE_OPTIONS] },
				{
					key: 'id_gateway_endpoint',
					labelKey: 'maintenance.erpIntegration.catalogs.items.gatewayEndpoints.title',
					label: 'Endpoint Gateway de Saída',
					type: 'custom',
					helperText: 'Usado no fluxo Query + SQLite para definir o endpoint de envio do JSON transformado.',
					render: ({ value, form, patch, readOnly, disabled }) => (
						<LookupSelect
							label="Endpoint Gateway de Saída"
							value={(form.id_gateway_endpoint_lookup as LookupOption | null) || optionFromValue(value, form.gateway_endpoint_nome)}
							loadOptions={(query, page, perPage) => loadServicoOptions(`/api/erp-cadastros/servicos/gateway-endpoint-options?id_template=${encodeURIComponent(String(form.id_template || ''))}`, query, page, perPage)}
							disabled={readOnly || disabled}
							onChange={(option) => {
								patch('id_gateway_endpoint', option?.id || '')
								patch('id_gateway_endpoint_lookup', option)
							}}
						/>
					),
				},
				{ key: 'saida_objeto', labelKey: 'maintenance.erpIntegration.catalogs.items.acoes.fields.outputObject', label: 'Saída do Objeto', type: 'select', options: [...SERVICO_OUTPUT_OPTIONS] },
				{ key: 'tipo_execucao', labelKey: 'maintenance.erpIntegration.catalogs.items.acoes.fields.executionType', label: 'Tipo de Execução', type: 'select', options: [...SERVICO_EXECUTION_TYPE_OPTIONS] },
				{ key: 'canal_execucao', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.channel', label: 'Canal de Execução', type: 'select', options: [...SERVICO_CHANNEL_OPTIONS] },
				{ key: 'filtro_sql', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.sqlFilter', label: 'Filtro SQL', type: 'textarea', rows: 3 },
				{ key: 'intervalo_execucao', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.interval', label: 'Intervalo de Execução (min)', type: 'select', options: SERVICO_INTERVAL_OPTIONS },
				{ key: 'modo_transformacao_gateway', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.gatewayTransformMode', label: 'Modo do Mapeamento', type: 'select', options: [{ value: 'registro', label: 'Por registro' }, { value: 'dataset_consolidado', label: 'Dataset consolidado' }] },
				{ key: 'dataset_source_path', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.datasetSourcePath', label: 'Caminho da Coleção Consolidada', type: 'text', maxLength: 255, placeholder: 'conta_receber_cadastro', helperText: 'Informe o caminho da coleção a consolidar no retorno bruto do endpoint, por exemplo conta_receber_cadastro ou data.items.' },
			],
		},
		{
			id: 'flags',
			titleKey: 'maintenance.erpIntegration.catalogs.items.servicos.sections.flags',
			title: 'Regras de execução',
			layout: 'rows',
			fields: [
				{ key: 'compara_delecao', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.compareDeletion', label: 'Comparar Deleção', type: 'toggle' },
				{ key: 'carga_geral', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.fullLoad', label: 'Carga Geral', type: 'toggle' },
				{ key: 'utiliza_sync_id', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.usesSyncId', label: 'Utiliza Sync ID', type: 'toggle' },
				{ key: 'especifico', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.specific', label: 'Específico', type: 'toggle' },
				{ key: 'obrigatorio', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.required', label: 'Obrigatório', type: 'toggle' },
			],
		},
		{
			id: 'gateway',
			titleKey: 'maintenance.erpIntegration.catalogs.items.servicos.sections.gateway',
			title: 'Mapeamento (Razor)',
			layout: 'rows',
			fields: [
				{ key: 'mapeamento', labelKey: 'maintenance.erpIntegration.catalogs.items.servicos.fields.mapping', label: 'Mapeamento (Razor)', type: 'custom', helperText: 'Carregue um exemplo do endpoint gateway, monte o script e aplique no formulário.', render: ({ value, patch, readOnly, disabled }) => <ScriptCodeEditor editorId="servico-mapeamento" language="razor" value={String(value ?? '')} onChange={(next) => patch('mapeamento', next)} readOnly={readOnly || disabled} height="420px" /> },
			],
		},
	],
	normalizeRecord: normalizeServicoCadastroRecord,
	beforeSave: buildServicoCadastroPayload,
}

