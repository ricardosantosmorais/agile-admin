import { StatusBadge } from '@/src/components/ui/status-badge'
import { CodeEditor } from '@/src/components/ui/code-editor'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import {
	buildParametroCadastroPayload,
	loadParametroCadastroGrupoOptions,
	loadParametroCadastroTemplateOptions,
	normalizeParametroCadastroRecord,
} from '@/src/features/integracao-com-erp-parametros-cadastro/services/integracao-com-erp-parametros-cadastro'

function renderBooleanBadge(value: unknown) {
	const active = value === true || value === 1 || value === '1' || value === 'true'
	return <StatusBadge tone={active ? 'success' : 'warning'}>{active ? 'Sim' : 'Não'}</StatusBadge>
}

function renderEnumBadge(value: unknown) {
	return <StatusBadge tone="neutral">{String(value || '-')}</StatusBadge>
}

function renderRelationLabel(record: Record<string, unknown>, valueKey: string, labelKey: string, lookupKey: string) {
	const lookup = typeof record[lookupKey] === 'object' && record[lookupKey] !== null
		? record[lookupKey] as { label?: unknown }
		: null
	const label = String(record[labelKey] ?? lookup?.label ?? '').trim()
	return <span className="block whitespace-normal leading-snug [overflow-wrap:anywhere]">{label || String(record[valueKey] || '-')}</span>
}

function renderTextValue(value: unknown) {
	return <span className="block whitespace-normal leading-snug [overflow-wrap:anywhere]">{String(value || '-')}</span>
}

export const INTEGRACAO_COM_ERP_PARAMETROS_CADASTRO_CONFIG: CrudModuleConfig = {
	key: 'integracao-com-erp-parametros-cadastro',
	resource: 'parametros_cadastro',
	routeBase: '/integracao-com-erp/cadastros/parametros-cadastro',
	featureKey: 'erpCadastrosParametrosCadastro',
	listTitleKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.title',
	listTitle: 'Parâmetros Cadastro',
	listDescriptionKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.listDescription',
	listDescription: 'Gerencie os parâmetros usados pelos cadastros e rotinas de integração com ERP.',
	formTitleKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.formTitle',
	formTitle: 'Parâmetro Cadastro',
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
	breadcrumbModuleKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.title',
	breadcrumbModule: 'Parâmetros Cadastro',
	defaultFilters: {
		page: 1,
		perPage: 15,
		orderBy: 'nome',
		sort: 'asc',
		id: '',
		id_parametro_grupo: '',
		id_template: '',
		'chave::lk': '',
		'nome::lk': '',
		tipo_entrada: '',
		tipo_valor: '',
		fonte_dados: '',
		ativo: '',
		ordem: '',
	},
	columns: [
		{ id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[72px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
		{
			id: 'id_parametro_grupo',
			labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.group',
			label: 'Grupo',
			sortKey: 'id_parametro_grupo',
			thClassName: 'w-[120px]',
			tdClassName: 'whitespace-normal align-middle',
			render: (record) => renderRelationLabel(record, 'id_parametro_grupo', 'parametros_grupo.nome', 'id_parametro_grupo_lookup'),
			filter: { kind: 'lookup', key: 'id_parametro_grupo', loadOptions: loadParametroCadastroGrupoOptions, pageSize: 30 },
		},
		{
			id: 'id_template',
			labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.template',
			label: 'Template',
			sortKey: 'id_template',
			visibility: 'lg',
			thClassName: 'w-[118px]',
			tdClassName: 'whitespace-normal align-middle',
			render: (record) => renderRelationLabel(record, 'id_template', 'templates.nome', 'id_template_lookup'),
			filter: { kind: 'lookup', key: 'id_template', loadOptions: loadParametroCadastroTemplateOptions, pageSize: 30 },
		},
		{
			id: 'chave',
			labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.key',
			label: 'Chave',
			sortKey: 'chave',
			thClassName: 'w-[190px]',
			tdClassName: 'font-medium text-[color:var(--app-text)]',
			render: (record) => renderTextValue(record.chave),
			filter: { kind: 'text', key: 'chave::lk' },
		},
		{
			id: 'nome',
			labelKey: 'simpleCrud.fields.name',
			label: 'Nome',
			sortKey: 'nome',
			thClassName: 'min-w-0',
			tdClassName: 'font-semibold text-[color:var(--app-text)]',
			render: (record) => renderTextValue(record.nome),
			filter: { kind: 'text', key: 'nome::lk' },
		},
		{
			id: 'tipo_entrada',
			labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.inputType',
			label: 'Tipo Entrada',
			sortKey: 'tipo_entrada',
			thClassName: 'w-[132px]',
			render: (record) => renderEnumBadge(record.tipo_entrada),
			filter: { kind: 'select', key: 'tipo_entrada', options: [{ value: 'livre', label: 'Livre' }, { value: 'combo', label: 'Combo' }] },
		},
		{
			id: 'tipo_valor',
			labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.valueType',
			label: 'Tipo Valor',
			sortKey: 'tipo_valor',
			visibility: 'lg',
			thClassName: 'w-[108px]',
			render: (record) => renderEnumBadge(record.tipo_valor),
			filter: { kind: 'select', key: 'tipo_valor', options: [{ value: 'texto', label: 'Texto' }, { value: 'senha', label: 'Senha' }, { value: 'numero', label: 'Número' }] },
		},
		{
			id: 'fonte_dados',
			labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.dataSource',
			label: 'Fonte Dados',
			sortKey: 'fonte_dados',
			visibility: 'xl',
			thClassName: 'w-[118px]',
			render: (record) => renderEnumBadge(record.fonte_dados),
			filter: { kind: 'select', key: 'fonte_dados', options: [{ value: 'lista_fixa', label: 'Lista fixa' }, { value: 'lista_endpoint', label: 'Lista endpoint' }] },
		},
		{
			id: 'ativo',
			labelKey: 'simpleCrud.fields.active',
			label: 'Ativo',
			sortKey: 'ativo',
			thClassName: 'w-[82px]',
			render: (record) => renderBooleanBadge(record.ativo),
			filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] },
		},
	],
	mobileTitle: (record) => String(record.nome || '-'),
	mobileSubtitle: (record) => String(record.chave || '-'),
	mobileMeta: (record) => `Grupo: ${String(record.id_parametro_grupo || '-')}`,
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
				{ key: 'obrigatorio', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.required', label: 'Obrigatório', type: 'toggle' },
				{ key: 'editavel', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.editable', label: 'Editável', type: 'toggle' },
				{ key: 'id_parametro_grupo', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.group', label: 'Grupo', type: 'lookup', optionsResource: 'parametros_grupo', required: true },
				{ key: 'id_template', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.template', label: 'Template', type: 'lookup', optionsResource: 'templates' },
				{ key: 'chave', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.key', label: 'Chave', type: 'text', required: true, maxLength: 120 },
				{ key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
				{ key: 'tipo_entrada', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.inputType', label: 'Tipo Entrada', type: 'select', required: true, defaultValue: 'livre', options: [{ value: 'livre', label: 'Livre' }, { value: 'combo', label: 'Combo' }] },
				{ key: 'tipo_valor', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.valueType', label: 'Tipo Valor', type: 'select', required: true, defaultValue: 'texto', options: [{ value: 'texto', label: 'Texto' }, { value: 'senha', label: 'Senha' }, { value: 'numero', label: 'Número' }] },
				{
					key: 'fonte_dados',
					labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.dataSource',
					label: 'Fonte Dados',
					type: 'select',
					hidden: ({ form }) => String(form.tipo_entrada || 'livre') !== 'combo',
					options: [{ value: '', label: 'Selecione' }, { value: 'lista_fixa', label: 'Lista fixa' }, { value: 'lista_endpoint', label: 'Lista endpoint' }],
				},
				{
					key: 'dados',
					labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.data',
					label: 'Dados',
					type: 'custom',
					hidden: ({ form }) => String(form.tipo_entrada || 'livre') !== 'combo',
					render: ({ value, form, readOnly, disabled, patch }) => (
						<CodeEditor
							editorId={`parametros-cadastro-dados-${String(form.id || 'novo')}`}
							language="json"
							value={String(value ?? '')}
							onChange={(nextValue) => patch('dados', nextValue)}
							height="300px"
							readOnly={readOnly || disabled}
						/>
					),
				},
				{ key: 'dono', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.owner', label: 'Dono', type: 'select', options: [{ value: '', label: 'Selecione' }, { value: 'empresa', label: 'Empresa' }, { value: 'aplicacao', label: 'Aplicação' }] },
				{ key: 'nivel_acesso', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.accessLevel', label: 'Nível de acesso', type: 'select', options: [{ value: '', label: 'Selecione' }, { value: 'privado', label: 'Privado' }, { value: 'publico', label: 'Público' }] },
				{ key: 'chave_plataforma', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.platformKey', label: 'Chave plataforma', type: 'text', maxLength: 120 },
				{ key: 'descricao', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.description', label: 'Descrição', type: 'textarea', rows: 4 },
				{ key: 'valor_default', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.defaultValue', label: 'Valor padrão', type: 'text', maxLength: 255 },
				{ key: 'ordem', labelKey: 'simpleCrud.fields.order', label: 'Ordem', type: 'number', inputMode: 'numeric' },
				{ key: 'id_parametro_ativacao', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.activationParameter', label: 'Parâmetro ativação', type: 'number', inputMode: 'numeric' },
				{ key: 'valor_ativacao', labelKey: 'maintenance.erpIntegration.catalogs.items.parametrosCadastro.fields.activationValue', label: 'Valor ativação', type: 'text', maxLength: 255 },
			],
		},
	],
	normalizeRecord: normalizeParametroCadastroRecord,
	beforeSave: buildParametroCadastroPayload,
}
