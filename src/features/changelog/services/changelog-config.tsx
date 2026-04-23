import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { buildChangelogAdminPayload, normalizeChangelogAdminRecord } from '@/src/features/changelog/services/changelog-admin'
import { formatDate } from '@/src/lib/formatters'

function booleanBadge(value: unknown, yesLabel: string, noLabel: string) {
	const checked = value === true || value === 1 || value === '1'
	return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? yesLabel : noLabel}</StatusBadge>
}

function platformBadge(value: unknown) {
	const normalized = String(value ?? '').trim().toLowerCase()
	const label = normalized === 'admin' ? 'Admin' : normalized === 'ecommerce' ? 'E-commerce' : normalized === 'integracao' ? 'Integração' : '-'
	return <StatusBadge tone="info">{label}</StatusBadge>
}

function typeBadge(value: unknown) {
	const normalized = String(value ?? '').trim().toLowerCase()
	const label = normalized === 'melhoria' ? 'Melhoria' : normalized === 'correcao' ? 'Correção' : 'Atualização'
	const tone = normalized === 'melhoria' ? 'success' : normalized === 'correcao' ? 'danger' : 'neutral'
	return <StatusBadge tone={tone}>{label}</StatusBadge>
}

function formatChangelogDate(record: CrudRecord) {
	const sourceValue = String(record.data_original ?? record.data ?? '').trim()
	return sourceValue ? formatDate(sourceValue) : '-'
}

function mobileMeta(record: CrudRecord) {
	return `${formatChangelogDate(record)} · ${String(record.plataforma ?? '-')} · ${String(record.tipo ?? '-')}`
}

export const CHANGELOG_CONFIG: CrudModuleConfig = {
	key: 'changelog',
	resource: 'changelog',
	routeBase: '/changelog',
	featureKey: 'changelog',
	listTitleKey: 'clientMenu.generalUpdates.admin.title',
	listTitle: 'Atualizações gerais',
	listDescriptionKey: 'clientMenu.generalUpdates.admin.listDescription',
	listDescription: 'Gerencie as publicações do changelog do produto.',
	formTitleKey: 'clientMenu.generalUpdates.admin.formTitle',
	formTitle: 'Atualização geral',
	hideBreadcrumbSection: true,
	breadcrumbSectionKey: 'routes.administration',
	breadcrumbSection: 'Administração',
	breadcrumbModuleKey: 'clientMenu.generalUpdates.admin.title',
	breadcrumbModule: 'Atualizações gerais',
	defaultFilters: {
		page: 1,
		perPage: 15,
		orderBy: 'data',
		sort: 'desc',
		id: '',
		'data::ge': '',
		'data::le': '',
		plataforma: '',
		tipo: '',
		'titulo::lk': '',
		apenas_master: '',
		ativo: '',
	},
	columns: [
		{
			id: 'id',
			labelKey: 'simpleCrud.fields.id',
			label: 'ID',
			sortKey: 'id',
			thClassName: 'w-[88px]',
			tdClassName: 'whitespace-nowrap',
			filter: { kind: 'text', key: 'id', widthClassName: 'md:col-span-1' },
		},
		{
			id: 'data',
			labelKey: 'clientMenu.generalUpdates.admin.fields.date',
			label: 'Data',
			sortKey: 'data',
			thClassName: 'w-[148px]',
			tdClassName: 'whitespace-nowrap',
			filter: { kind: 'date-range', fromKey: 'data::ge', toKey: 'data::le', widthClassName: 'md:col-span-2 xl:col-span-2' },
			render: (record) => <span className="whitespace-nowrap">{formatChangelogDate(record)}</span>,
		},
		{
			id: 'plataforma',
			labelKey: 'clientMenu.generalUpdates.admin.fields.platform',
			label: 'Plataforma',
			sortKey: 'plataforma',
			thClassName: 'w-[124px]',
			filter: {
				kind: 'select',
				key: 'plataforma',
				widthClassName: 'md:col-span-1',
				options: [
					{ value: 'admin', label: 'Admin' },
					{ value: 'ecommerce', label: 'E-commerce' },
					{ value: 'integracao', label: 'Integração' },
				],
			},
			render: (record) => platformBadge(record.plataforma),
		},
		{
			id: 'tipo',
			labelKey: 'clientMenu.generalUpdates.admin.fields.type',
			label: 'Tipo',
			sortKey: 'tipo',
			thClassName: 'w-[118px]',
			filter: {
				kind: 'select',
				key: 'tipo',
				widthClassName: 'md:col-span-1',
				options: [
					{ value: 'melhoria', label: 'Melhoria' },
					{ value: 'correcao', label: 'Correção' },
					{ value: 'geral', label: 'Atualização' },
				],
			},
			render: (record) => typeBadge(record.tipo),
		},
		{
			id: 'titulo',
			labelKey: 'clientMenu.generalUpdates.admin.fields.title',
			label: 'Título',
			sortKey: 'titulo',
			tdClassName: 'max-w-[380px] text-[color:var(--app-text)]',
			filter: { kind: 'text', key: 'titulo::lk', placeholder: 'Buscar por título', widthClassName: 'md:col-span-1 xl:col-span-1' },
			render: (record) => (
				<span className="block truncate font-semibold text-[color:var(--app-text)] opacity-100">
					{String(record.titulo || '-')}
				</span>
			),
		},
		{
			id: 'apenas_master',
			labelKey: 'clientMenu.generalUpdates.admin.fields.internalOnly',
			label: 'Apenas para master',
			sortKey: 'apenas_master',
			thClassName: 'w-[156px]',
			filter: {
				kind: 'select',
				key: 'apenas_master',
				widthClassName: 'md:col-span-1',
				options: [
					{ value: '1', label: 'Sim' },
					{ value: '0', label: 'Não' },
				],
			},
			render: (record, context) => booleanBadge(record.apenas_master, context.t('common.yes', 'Yes'), context.t('common.no', 'No')),
		},
		{
			id: 'ativo',
			labelKey: 'simpleCrud.fields.active',
			label: 'Ativo',
			sortKey: 'ativo',
			thClassName: 'w-[96px]',
			filter: {
				kind: 'select',
				key: 'ativo',
				widthClassName: 'md:col-span-1',
				options: [
					{ value: '1', label: 'Sim' },
					{ value: '0', label: 'Não' },
				],
			},
			render: (record, context) => booleanBadge(record.ativo, context.t('common.yes', 'Yes'), context.t('common.no', 'No')),
		},
	],
	mobileTitle: (record) => String(record.titulo || '-'),
	mobileSubtitle: (record) => String(record.id || '-'),
	mobileMeta,
	selectable: false,
	actionsColumnClassName: 'w-[104px] whitespace-nowrap',
	normalizeRecord: normalizeChangelogAdminRecord,
	beforeSave: (record) => buildChangelogAdminPayload(record),
	sections: [
		{
			id: 'main',
			titleKey: 'clientMenu.generalUpdates.admin.sectionMain',
			title: 'Dados da atualização',
			layout: 'rows',
			fields: [
				{ key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true },
				{ key: 'apenas_master', labelKey: 'clientMenu.generalUpdates.admin.fields.internalOnly', label: 'Apenas para master', type: 'toggle', defaultValue: false },
				{ key: 'data', labelKey: 'clientMenu.generalUpdates.admin.fields.date', label: 'Data', type: 'date', required: true, layoutClassName: 'max-w-[260px]' },
				{
					key: 'plataforma',
					labelKey: 'clientMenu.generalUpdates.admin.fields.platform',
					label: 'Plataforma',
					type: 'select',
					required: true,
					options: [
						{ value: 'admin', label: 'Admin' },
						{ value: 'ecommerce', label: 'E-commerce' },
						{ value: 'integracao', label: 'Integração' },
					],
					layoutClassName: 'max-w-[320px]',
				},
				{
					key: 'tipo',
					labelKey: 'clientMenu.generalUpdates.admin.fields.type',
					label: 'Tipo',
					type: 'select',
					required: true,
					options: [
						{ value: 'melhoria', label: 'Melhoria' },
						{ value: 'correcao', label: 'Correção' },
						{ value: 'geral', label: 'Atualização' },
					],
					layoutClassName: 'max-w-[320px]',
				},
				{ key: 'titulo', labelKey: 'clientMenu.generalUpdates.admin.fields.title', label: 'Título', type: 'text', required: true, maxLength: 180, layoutClassName: 'max-w-[720px]' },
				{ key: 'conteudo', labelKey: 'clientMenu.generalUpdates.admin.fields.content', label: 'Conteúdo', type: 'richtext', required: true, layoutClassName: 'w-full max-w-[980px]' },
			],
		},
	],
}
