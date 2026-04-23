import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import {
	buildScriptPayload,
	normalizeScriptRecord,
	SCRIPT_LANGUAGE_OPTIONS,
} from '@/src/features/integracao-com-erp-scripts/services/integracao-com-erp-scripts'

function renderText(value: unknown) {
	return <span className="block whitespace-normal leading-snug [overflow-wrap:anywhere]">{String(value || '-')}</span>
}

export const INTEGRACAO_COM_ERP_SCRIPTS_CONFIG: CrudModuleConfig = {
	key: 'integracao-com-erp-scripts',
	resource: 'scripts',
	routeBase: '/integracao-com-erp/cadastros/scripts',
	featureKey: 'erpCadastrosScripts',
	listTitleKey: 'maintenance.erpIntegration.catalogs.items.scripts.title',
	listTitle: 'Scripts',
	listDescriptionKey: 'maintenance.erpIntegration.catalogs.items.scripts.listDescription',
	listDescription: 'Gerencie os scripts usados pelas rotinas e serviços de integração com ERP.',
	formTitleKey: 'maintenance.erpIntegration.catalogs.items.scripts.formTitle',
	formTitle: 'Script',
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
	breadcrumbModuleKey: 'maintenance.erpIntegration.catalogs.items.scripts.title',
	breadcrumbModule: 'Scripts',
	defaultFilters: {
		page: 1,
		perPage: 15,
		orderBy: 'id',
		sort: 'desc',
		id: '',
		'nome::lk': '',
		'linguagem::lk': '',
	},
	columns: [
		{ id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[80px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
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
			id: 'linguagem',
			labelKey: 'maintenance.erpIntegration.catalogs.items.scripts.fields.language',
			label: 'Linguagem',
			sortKey: 'linguagem',
			thClassName: 'w-[170px]',
			render: (record) => <StatusBadge tone="neutral">{String(record.linguagem || '-')}</StatusBadge>,
			filter: {
				kind: 'select',
				key: 'linguagem::lk',
				options: SCRIPT_LANGUAGE_OPTIONS.map((value) => ({ value, label: value })),
			},
		},
	],
	mobileTitle: (record) => String(record.nome || '-'),
	mobileSubtitle: (record) => `Linguagem: ${String(record.linguagem || '-')}`,
	renderMobileBadges: (record) => <StatusBadge tone="neutral">{String(record.linguagem || '-')}</StatusBadge>,
	selectable: false,
	canDeleteRow: () => false,
	sections: [],
	normalizeRecord: normalizeScriptRecord,
	beforeSave: buildScriptPayload,
}
