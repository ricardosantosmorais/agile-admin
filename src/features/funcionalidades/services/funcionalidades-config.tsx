import { FileSearch } from 'lucide-react'
import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { IconPickerPreview } from '@/src/components/ui/icon-picker-field'
import { funcionalidadesClient } from '@/src/features/funcionalidades/services/funcionalidades-client'
import { buildFuncionalidadePayload, FUNCIONALIDADE_ROOT_PARENT_OPTION, normalizeFuncionalidadeRecord } from '@/src/features/funcionalidades/services/funcionalidades-mappers'

const ACTION_OPTIONS = [
	{ value: 'listar', labelKey: 'registrations.features.actions.list', label: 'Listar' },
	{ value: 'visualizar', labelKey: 'registrations.features.actions.view', label: 'Visualizar' },
	{ value: 'editar', labelKey: 'registrations.features.actions.edit', label: 'Editar' },
	{ value: 'deletar', labelKey: 'registrations.features.actions.delete', label: 'Deletar' },
	{ value: 'criar', labelKey: 'registrations.features.actions.create', label: 'Criar' },
	{ value: 'exportar', labelKey: 'registrations.features.actions.export', label: 'Exportar' },
	{ value: 'logs', labelKey: 'registrations.features.actions.logs', label: 'Visualizar Logs' },
	{ value: 'executar', labelKey: 'registrations.features.actions.execute', label: 'Executar' },
	{ value: 'aprovar_pagamento', labelKey: 'registrations.features.actions.approvePayment', label: 'Aprovar pagamento' },
	{ value: 'cancelar_pedido', labelKey: 'registrations.features.actions.cancelOrder', label: 'Cancelar Pedido' },
	{ value: 'desbloquear_cliente', labelKey: 'registrations.features.actions.unblockCustomer', label: 'Desbloquear Cliente' },
	{ value: 'editar_query', labelKey: 'registrations.features.actions.editQuery', label: 'Editar Query' },
	{ value: 'visualizar_relatorios_comercial', labelKey: 'registrations.features.actions.viewCommercialReports', label: 'Visualizar Relatórios Comercial' },
	{ value: 'visualizar_relatorios_marketing', labelKey: 'registrations.features.actions.viewMarketingReports', label: 'Visualizar Relatórios Marketing' },
] as const

function text(value: unknown) {
	return String(value ?? '').trim()
}

function booleanBadge(value: unknown, yes: string, no: string) {
	const checked = value === true || value === 1 || value === '1'
	return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? yes : no}</StatusBadge>
}

function renderName(record: CrudRecord, context: { tenantUrl?: string | null }) {
	const normalized = normalizeFuncionalidadeRecord(record)
	const url = text(normalized.url)
	const content = (
		<div className="min-w-0">
			<div className="flex min-w-0 items-center gap-2">
				{normalized.icone ? (
					<span className="app-control-muted inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[color:var(--app-text)]">
						<IconPickerPreview value={normalized.icone} className="h-4 w-4" />
					</span>
				) : null}
				<span className="truncate font-semibold text-[color:var(--app-text)]">{normalized.nome || '-'}</span>
			</div>
			{normalized.componente ? <span className="mt-0.5 block truncate text-xs text-[color:var(--app-muted)]">{normalized.componente}</span> : null}
		</div>
	)

	if (!url) {
		return content
	}

	const href = /^https?:\/\//i.test(url)
		? url
		: `${context.tenantUrl ?? ''}${url.startsWith('/') ? url : `/${url}`}`

	return (
		<a href={href} target="_blank" rel="noreferrer" className="block min-w-0 transition hover:opacity-80">
			{content}
		</a>
	)
}

export const FUNCIONALIDADE_ACTION_OPTIONS = ACTION_OPTIONS

export const FUNCIONALIDADES_CONFIG: CrudModuleConfig = {
	key: 'funcionalidades',
	resource: 'funcionalidades',
	routeBase: '/cadastros/funcionalidades',
	featureKey: 'funcionalidades',
	listTitleKey: 'registrations.features.title',
	listTitle: 'Funcionalidades',
	listDescriptionKey: 'registrations.features.listDescription',
	listDescription: 'Cadastro das funcionalidades, menu, ações de permissão e empresas vinculadas.',
	formTitleKey: 'registrations.features.formTitle',
	formTitle: 'Funcionalidade',
	breadcrumbSectionKey: 'routes.cadastros',
	breadcrumbSection: 'Cadastros',
	breadcrumbModuleKey: 'routes.funcionalidades',
	breadcrumbModule: 'Funcionalidades',
	defaultFilters: {
		page: 1,
		perPage: 15,
		orderBy: 'nivel',
		sort: 'asc',
		id: '',
		id_funcionalidade_pai: '',
		id_funcionalidade_pai_label: '',
		'nome::like': '',
		nivel: '',
		posicao: '',
		menu: '',
		ativo: '',
	},
	listEmbed: 'funcionalidade_pai',
	formEmbed: 'funcionalidade_pai,empresas',
	normalizeRecord: normalizeFuncionalidadeRecord,
	beforeSave: (record) => buildFuncionalidadePayload(record) as unknown as CrudRecord,
	stayOnSave: true,
	columns: [
		{ id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[110px]', filter: { kind: 'text', key: 'id' } },
		{
			id: 'funcionalidade_pai_nome',
			labelKey: 'registrations.features.fields.parent',
			label: 'Funcionalidade Pai',
			sortKey: 'funcionalidade_pai:nome',
			visibility: 'lg',
			filter: {
				kind: 'lookup',
				key: 'id_funcionalidade_pai',
				loadOptions: (query, page, perPage) => funcionalidadesClient.listParentOptions(query, page, perPage),
				pageSize: 20,
			},
		},
		{
			id: 'nome',
			labelKey: 'simpleCrud.fields.name',
			label: 'Nome',
			sortKey: 'nome',
			tdClassName: 'min-w-[220px]',
			filter: { kind: 'text', key: 'nome::like' },
			render: renderName,
		},
		{ id: 'nivel', labelKey: 'registrations.features.fields.level', label: 'Nível', sortKey: 'nivel', thClassName: 'w-[110px]', filter: { kind: 'text', key: 'nivel', inputMode: 'numeric' } },
		{ id: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posição', sortKey: 'posicao', thClassName: 'w-[110px]', filter: { kind: 'text', key: 'posicao', inputMode: 'numeric' } },
		{ id: 'menu', labelKey: 'registrations.features.fields.menu', label: 'Menu', sortKey: 'menu', thClassName: 'w-[110px]', filter: { kind: 'select', key: 'menu', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] }, render: (record, { t }) => booleanBadge(record.menu, t('common.yes', 'Sim'), t('common.no', 'Não')) },
		{ id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[110px]', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] }, render: (record, { t }) => booleanBadge(record.ativo, t('common.yes', 'Sim'), t('common.no', 'Não')) },
	],
	mobileTitle: (record) => text(record.nome) || '-',
	mobileSubtitle: (record) => text(record.funcionalidade_pai_nome) || 'Raiz',
	renderMobileBadges: (record, { t }) => (
		<div className="flex flex-wrap gap-2">
			{booleanBadge(record.menu, 'Menu', 'Fora do menu')}
			{booleanBadge(record.ativo, t('common.active', 'Ativo'), t('common.inactive', 'Inativo'))}
		</div>
	),
	buildListRowActions: ({ record, t }) => [
		{
			id: 'logs',
			label: t('simpleCrud.actions.logs', 'Logs'),
			icon: FileSearch,
			href: `/logs?modulo=funcionalidades&id_registro=${encodeURIComponent(record.id)}`,
			visible: true,
		},
	],
	actionsColumnClassName: 'w-[156px] min-w-[156px] whitespace-nowrap',
	sections: [
		{
			id: 'main',
			titleKey: 'basicRegistrations.sections.general',
			title: 'Dados gerais',
			layout: 'rows',
			fields: [
				{
					key: 'ativo',
					labelKey: 'simpleCrud.fields.active',
					label: 'Ativo',
					type: 'toggle',
					required: true,
					defaultValue: true,
					helperTextKey: 'registrations.features.fields.activeHint',
					helperText: 'Define se a funcionalidade participa das permissões.',
				},
				{
					key: 'menu',
					labelKey: 'registrations.features.fields.menu',
					label: 'Menu',
					type: 'toggle',
					required: true,
					defaultValue: false,
					helperTextKey: 'registrations.features.fields.menuHint',
					helperText: 'Quando ativo, aparece na navegação do Admin.',
				},
				{ key: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posição', type: 'number', required: true, inputMode: 'numeric' },
				{ key: 'nivel', labelKey: 'registrations.features.fields.level', label: 'Nível', type: 'number', required: true, inputMode: 'numeric' },
				{
					key: 'codigo',
					labelKey: 'simpleCrud.fields.code',
					label: 'Código',
					type: 'text',
					maxLength: 32,
					helperTextKey: 'registrations.features.fields.codeHint',
					helperText: 'Identificador técnico opcional, com até 32 caracteres.',
				},
				{
					key: 'id_funcionalidade_pai',
					labelKey: 'registrations.features.fields.parent',
					label: 'Funcionalidade Pai',
					type: 'lookup',
					defaultValue: null,
					lookupStateKey: 'funcionalidade_pai_lookup',
					lookupDefaultOption: FUNCIONALIDADE_ROOT_PARENT_OPTION,
					lookupLoadOptions: async ({ query, page, perPage, form, t }) => {
						const options = await funcionalidadesClient.listParentOptions(query, page, perPage, text(form.id))
						return page === 1 && !query
							? [{ ...FUNCIONALIDADE_ROOT_PARENT_OPTION, description: t('registrations.features.fields.rootParent', 'Sem funcionalidade pai') }, ...options]
							: options
					},
					mapLookupSelection: ({ option }) => ({
						value: option?.id === FUNCIONALIDADE_ROOT_PARENT_OPTION.id ? null : option?.id ?? null,
						lookup: option?.id === FUNCIONALIDADE_ROOT_PARENT_OPTION.id ? FUNCIONALIDADE_ROOT_PARENT_OPTION : option,
					}),
				},
				{ key: 'acao', labelKey: 'registrations.features.fields.action', label: 'Ação', type: 'select', options: [...ACTION_OPTIONS] },
				{ key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
				{
					key: 'icone',
					labelKey: 'registrations.features.fields.icon',
					label: 'Ícone',
					type: 'icon',
					helperTextKey: 'registrations.features.fields.iconHint',
					helperText: 'Selecione um ícone da biblioteca atual. Ícones FontAwesome do legado são convertidos para uma sugestão compatível.',
				},
				{ key: 'url', labelKey: 'registrations.features.fields.url', label: 'URL', type: 'text' },
				{ key: 'componente', labelKey: 'registrations.features.fields.component', label: 'Componente', type: 'text' },
				{ key: 'clique', labelKey: 'registrations.features.fields.click', label: 'Clique', type: 'text' },
				{ key: 'descricao', labelKey: 'registrations.features.fields.description', label: 'Descrição', type: 'textarea', rows: 4, maxLength: 255 },
			],
		},
	],
}
