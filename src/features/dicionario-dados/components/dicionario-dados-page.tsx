'use client';

import { Download, FileText, Loader2, Search, Table2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AsyncState } from '@/src/components/ui/async-state';
import { OverlayModal } from '@/src/components/ui/overlay-modal';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { RichTextEditor } from '@/src/components/ui/rich-text-editor';
import { SectionCard } from '@/src/components/ui/section-card';
import { StatusBadge } from '@/src/components/ui/status-badge';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { dicionarioDadosClient } from '@/src/features/dicionario-dados/services/dicionario-dados-client';
import type {
	DicionarioComponenteCampo,
	DicionarioComponenteCamposResponse,
	DicionarioTabelaDetalhe,
	DicionarioTabelaTreeNode,
} from '@/src/features/dicionario-dados/services/dicionario-dados-types';
import { useI18n } from '@/src/i18n/use-i18n';

type TabMode = 'componentes' | 'descricao' | 'regras';
type FieldModalMode = 'descricao' | 'regra';

type ToastState = {
	tone: 'success' | 'error';
	message: string;
};

type TranslateFn = ReturnType<typeof useI18n>['t'];

function getStatusBadgeTone(status: DicionarioComponenteCampo['status']) {
	if (status === 'encontrado') return 'success';
	if (status === 'ignorado') return 'info';
	return 'warning';
}

function getStatusLabel(status: DicionarioComponenteCampo['status'], t: TranslateFn) {
	if (status === 'encontrado') return t('dataDictionary.status.found', 'Encontrado');
	if (status === 'ignorado') return t('dataDictionary.status.ignored', 'Ignorado');
	return t('dataDictionary.status.unavailable', 'Não disponível');
}

export function DicionarioDadosPage() {
	const { t } = useI18n();
	const { session } = useAuth();
	const access = useFeatureAccess('dicionarioDados');

	const [tablesState, setTablesState] = useState<{
		loading: boolean;
		error: string;
		data: DicionarioTabelaTreeNode[];
	}>({
		loading: true,
		error: '',
		data: [],
	});
	const [tableSearch, setTableSearch] = useState('');
	const [selectedTableId, setSelectedTableId] = useState('');
	const [tableDetailState, setTableDetailState] = useState<{
		loading: boolean;
		error: string;
		data: DicionarioTabelaDetalhe | null;
	}>({
		loading: false,
		error: '',
		data: null,
	});
	const [activeTab, setActiveTab] = useState<TabMode>('componentes');
	const [selectedComponentId, setSelectedComponentId] = useState('');
	const [componentFieldsState, setComponentFieldsState] = useState<{
		loading: boolean;
		error: string;
		data: DicionarioComponenteCamposResponse | null;
	}>({
		loading: false,
		error: '',
		data: null,
	});
	const [ignoreModalField, setIgnoreModalField] = useState<DicionarioComponenteCampo | null>(null);
	const [ignoreObservation, setIgnoreObservation] = useState('');
	const [fieldEditModal, setFieldEditModal] = useState<{
		mode: FieldModalMode;
		field: DicionarioComponenteCampo;
	} | null>(null);
	const [tableEditModal, setTableEditModal] = useState<{
		mode: 'descricao' | 'regra';
		value: string;
	} | null>(null);
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState<ToastState | null>(null);

	useEffect(() => {
		void (async () => {
			try {
				const tables = await dicionarioDadosClient.listTabelas();
				setTablesState({ loading: false, error: '', data: tables });
				if (tables[0]) {
					const firstId = tables[0].id;
					setSelectedTableId(firstId);
					setTableDetailState({ loading: true, error: '', data: null });
					try {
						const firstTable = await dicionarioDadosClient.getTabela(firstId);
						setTableDetailState({ loading: false, error: '', data: firstTable });
					} catch (detailError) {
						setTableDetailState({
							loading: false,
							error: detailError instanceof Error ? detailError.message : t('dataDictionary.feedback.loadTableDetailsError', 'Não foi possível carregar os detalhes da tabela.'),
							data: null,
						});
					}
				}
			} catch (error) {
				setTablesState({
					loading: false,
					error: error instanceof Error ? error.message : t('dataDictionary.feedback.loadTablesError', 'Não foi possível carregar as tabelas do dicionário.'),
					data: [],
				});
			}
		})();
	}, [t]);

	const filteredTables = useMemo(() => {
		const normalizedSearch = tableSearch.trim().toLowerCase();
		if (!normalizedSearch) return tablesState.data;
		return tablesState.data.filter((table) => {
			const tableMatch = table.nome.toLowerCase().includes(normalizedSearch);
			const fieldMatch = table.fields.some((field) => field.nome.toLowerCase().includes(normalizedSearch));
			return tableMatch || fieldMatch;
		});
	}, [tableSearch, tablesState.data]);

	async function loadTable(id: string) {
		setSelectedTableId(id);
		setSelectedComponentId('');
		setComponentFieldsState({ loading: false, error: '', data: null });
		setTableDetailState({ loading: true, error: '', data: null });
		setActiveTab('componentes');

		try {
			const table = await dicionarioDadosClient.getTabela(id);
			setTableDetailState({ loading: false, error: '', data: table });
		} catch (error) {
			setTableDetailState({
				loading: false,
				error: error instanceof Error ? error.message : t('dataDictionary.feedback.loadTableDetailsError', 'Não foi possível carregar os detalhes da tabela.'),
				data: null,
			});
		}
	}

	async function loadComponentFields(idComponente: string) {
		if (!selectedTableId) return;
		setSelectedComponentId(idComponente);
		setComponentFieldsState({ loading: true, error: '', data: null });

		try {
			const response = await dicionarioDadosClient.getComponenteCampos(idComponente, selectedTableId);
			setComponentFieldsState({ loading: false, error: '', data: response });
		} catch (error) {
			setComponentFieldsState({
				loading: false,
				error: error instanceof Error ? error.message : t('dataDictionary.feedback.loadComponentFieldsError', 'Não foi possível carregar os campos do componente.'),
				data: null,
			});
		}
	}

	async function saveTableDetail(mode: 'descricao' | 'regra', value: string) {
		if (!tableDetailState.data) return;

		setSaving(true);
		try {
			await dicionarioDadosClient.saveTabela(tableDetailState.data.id, mode === 'descricao' ? { descricao: value } : { regra: value });
			setTableDetailState((current) => {
				if (!current.data) return current;
				return {
					...current,
					data: {
						...current.data,
						[mode]: value,
					},
				};
			});
			setTableEditModal(null);
			setToast({ tone: 'success', message: t('dataDictionary.feedback.tableUpdated', 'Tabela atualizada com sucesso.') });
		} catch (error) {
			setToast({
				tone: 'error',
				message: error instanceof Error ? error.message : t('dataDictionary.feedback.saveTableError', 'Não foi possível salvar a tabela.'),
			});
		} finally {
			setSaving(false);
		}
	}

	async function saveField(mode: FieldModalMode, fieldId: string, value: string) {
		setSaving(true);
		try {
			await dicionarioDadosClient.saveCampo(fieldId, mode === 'descricao' ? { descricao: value } : { regra: value });
			setFieldEditModal(null);
			if (selectedComponentId) {
				await loadComponentFields(selectedComponentId);
			}
			setToast({ tone: 'success', message: t('dataDictionary.feedback.fieldUpdated', 'Campo atualizado com sucesso.') });
		} catch (error) {
			setToast({
				tone: 'error',
				message: error instanceof Error ? error.message : t('dataDictionary.feedback.saveFieldError', 'Não foi possível salvar o campo.'),
			});
		} finally {
			setSaving(false);
		}
	}

	async function ignoreField() {
		if (!ignoreModalField || !componentFieldsState.data || !ignoreObservation.trim()) {
			return;
		}

		setSaving(true);
		try {
			await dicionarioDadosClient.ignoreCampo({
				idComponente: componentFieldsState.data.componente.id,
				idTabela: componentFieldsState.data.tabela.id,
				idDicionarioTabelaCampo: ignoreModalField.id,
				idUsuario: session?.user.id || '',
				observacao: ignoreObservation.trim(),
			});
			setIgnoreModalField(null);
			setIgnoreObservation('');
			if (selectedComponentId) {
				await loadComponentFields(selectedComponentId);
			}
			setToast({ tone: 'success', message: t('dataDictionary.feedback.fieldIgnored', 'Campo marcado como ignorado.') });
		} catch (error) {
			setToast({
				tone: 'error',
				message: error instanceof Error ? error.message : t('dataDictionary.feedback.ignoreFieldError', 'Não foi possível ignorar o campo.'),
			});
		} finally {
			setSaving(false);
		}
	}

	async function removeIgnoredField(field: DicionarioComponenteCampo) {
		if (!componentFieldsState.data || !field.ignoredRecordId) return;

		setSaving(true);
		try {
			await dicionarioDadosClient.removeCampoIgnorado(field.ignoredRecordId, {
				idComponente: componentFieldsState.data.componente.id,
				idDicionarioTabelaCampo: field.id,
			});
			if (selectedComponentId) {
				await loadComponentFields(selectedComponentId);
			}
			setToast({ tone: 'success', message: t('dataDictionary.feedback.statusRemoved', 'Status removido com sucesso.') });
		} catch (error) {
			setToast({
				tone: 'error',
				message: error instanceof Error ? error.message : t('dataDictionary.feedback.removeStatusError', 'Não foi possível remover o status.'),
			});
		} finally {
			setSaving(false);
		}
	}

	async function exportDictionary() {
		setSaving(true);
		try {
			const blob = await dicionarioDadosClient.exportHtml();
			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);
			link.download = 'dicionario.html';
			link.click();
			URL.revokeObjectURL(link.href);
		} catch (error) {
			setToast({
				tone: 'error',
				message: error instanceof Error ? error.message : t('dataDictionary.feedback.exportError', 'Não foi possível exportar o dicionário.'),
			});
		} finally {
			setSaving(false);
		}
	}

	if (!access.canOpen) {
		return <AccessDeniedState title={t('dataDictionary.title', 'Dicionário de dados')} />;
	}

	return (
		<div className="space-y-5">
			<PageHeader
				title={t('dataDictionary.title', 'Dicionário de dados')}
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Home'), href: '/dashboard' },
					{ label: t('menuKeys.ferramentas', 'Ferramentas') },
					{ label: t('dataDictionary.title', 'Dicionário de dados') },
				]}
				actions={
					<button
						type="button"
						onClick={() => void exportDictionary()}
						disabled={saving}
						className="inline-flex items-center gap-2 rounded-full border border-[#e5dbc9] bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
					>
						{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
						{t('dataDictionary.actions.exportHtml', 'Exportar HTML')}
					</button>
				}
			/>

			<div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
				<SectionCard className="space-y-3">
					<label className="relative block">
						<Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
						<input
							value={tableSearch}
							onChange={(event) => setTableSearch(event.target.value)}
							placeholder={t('dataDictionary.searchPlaceholder', 'Buscar tabela ou campo')}
							className="w-full rounded-[0.9rem] border border-[#e4dbc9] bg-white py-2 pl-9 pr-3 text-sm outline-none"
						/>
					</label>

					<AsyncState isLoading={tablesState.loading} error={tablesState.error}>
						<div className="max-h-[70vh] space-y-2 overflow-y-auto">
							{filteredTables.map((table) => (
								<div key={table.id} className="rounded-[0.95rem] border border-[#ece3d6] bg-white p-2.5">
									<button
										type="button"
										onClick={() => void loadTable(table.id)}
										className={[
											'flex w-full items-center justify-between gap-2 rounded-[0.7rem] px-2 py-1.5 text-left text-sm font-semibold',
											selectedTableId === table.id ? 'bg-slate-950 text-white' : 'text-slate-800 hover:bg-[#f7f3ec]',
										].join(' ')}
									>
										<span className="inline-flex items-center gap-2 truncate">
											<Table2 className="h-4 w-4 shrink-0" />
											{table.nome}
										</span>
										{table.hasComponents ? <StatusBadge tone="info">{t('dataDictionary.componentBadge', 'Componente')}</StatusBadge> : null}
									</button>

									{table.fields.length ? (
										<div className="mt-2 space-y-1 pl-2">
											{table.fields.slice(0, 8).map((field) => (
												<div key={field.id} className="truncate text-xs text-slate-500">
													{field.nome}
												</div>
											))}
											{table.fields.length > 8 ? (
												<div className="text-xs text-slate-400">{t('dataDictionary.moreFields', '+{{count}} campos', { count: table.fields.length - 8 })}</div>
											) : null}
										</div>
									) : null}
								</div>
							))}
						</div>
					</AsyncState>
				</SectionCard>

				<SectionCard className="space-y-4">
					<AsyncState isLoading={tableDetailState.loading} error={tableDetailState.error}>
						{tableDetailState.data ? (
							<div className="space-y-4">
								<div className="flex items-center justify-between gap-3">
									<h2 className="text-xl font-bold text-slate-900">
										{t('dataDictionary.tableTitle', 'Tabela')}: {tableDetailState.data.nome}
									</h2>
									<div className="inline-flex items-center rounded-full border border-[#e5dbc9] bg-white p-1">
										<button
											type="button"
											onClick={() => setActiveTab('componentes')}
											className={['rounded-full px-3 py-1.5 text-xs font-semibold', activeTab === 'componentes' ? 'bg-slate-950 text-white' : 'text-slate-600'].join(' ')}
										>
											{t('dataDictionary.tabs.components', 'Componentes')}
										</button>
										<button
											type="button"
											onClick={() => setActiveTab('descricao')}
											className={['rounded-full px-3 py-1.5 text-xs font-semibold', activeTab === 'descricao' ? 'bg-slate-950 text-white' : 'text-slate-600'].join(' ')}
										>
											{t('dataDictionary.tabs.description', 'Descrição')}
										</button>
										<button
											type="button"
											onClick={() => setActiveTab('regras')}
											className={['rounded-full px-3 py-1.5 text-xs font-semibold', activeTab === 'regras' ? 'bg-slate-950 text-white' : 'text-slate-600'].join(' ')}
										>
											{t('dataDictionary.tabs.rules', 'Regras')}
										</button>
									</div>
								</div>

								{activeTab === 'componentes' ? (
									<div className="space-y-4">
										<div className="overflow-x-auto rounded-[1rem] border border-[#ece3d6] bg-white">
											<table className="min-w-full text-left text-sm">
												<thead className="bg-[#f8f4ec] text-xs uppercase text-slate-600">
													<tr>
														<th className="px-3 py-2">{t('dataDictionary.columns.id', 'ID')}</th>
														<th className="px-3 py-2">{t('dataDictionary.columns.name', 'Nome')}</th>
														<th className="px-3 py-2">{t('dataDictionary.columns.file', 'Arquivo')}</th>
														<th className="px-3 py-2">{t('dataDictionary.columns.active', 'Ativo')}</th>
														<th className="px-3 py-2 text-right">{t('dataDictionary.columns.actions', 'Ações')}</th>
													</tr>
												</thead>
												<tbody>
													{tableDetailState.data.componentes.map((component) => (
														<tr key={component.id} className="border-t border-[#efe8dc]">
															<td className="px-3 py-2">{component.id}</td>
															<td className="px-3 py-2 font-semibold">{component.nome}</td>
															<td className="px-3 py-2">{component.arquivo}</td>
															<td className="px-3 py-2">{component.ativo ? t('common.yes', 'Sim') : t('common.no', 'Não')}</td>
															<td className="px-3 py-2 text-right">
																<button
																	type="button"
																	onClick={() => void loadComponentFields(component.id)}
																	className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white"
																>
																	<Search className="h-3.5 w-3.5" />
																	{t('dataDictionary.actions.details', 'Detalhes')}
																</button>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>

										{selectedComponentId ? (
											<AsyncState isLoading={componentFieldsState.loading} error={componentFieldsState.error}>
												{componentFieldsState.data ? (
													<div className="space-y-3">
														<h3 className="text-base font-semibold text-slate-900">
															{t('dataDictionary.componentFieldsTitle', 'Campos do componente {{file}}', { file: componentFieldsState.data.componente.arquivo })}
														</h3>
														<div className="overflow-x-auto rounded-[1rem] border border-[#ece3d6] bg-white">
															<table className="min-w-full text-left text-sm">
																<thead className="bg-[#f8f4ec] text-xs uppercase text-slate-600">
																	<tr>
																		<th className="px-3 py-2">{t('dataDictionary.columns.field', 'Campo')}</th>
																		<th className="px-3 py-2">{t('dataDictionary.columns.position', 'Posição')}</th>
																		<th className="px-3 py-2">{t('dataDictionary.columns.status', 'Status')}</th>
																		<th className="px-3 py-2 text-right">{t('dataDictionary.columns.actions', 'Ações')}</th>
																	</tr>
																</thead>
																<tbody>
																	{componentFieldsState.data.fields.map((field) => (
																		<tr key={field.id} className="border-t border-[#efe8dc]">
																			<td className="px-3 py-2">{field.nome}</td>
																			<td className="px-3 py-2">{field.posicao}</td>
																			<td className="px-3 py-2">
																				<StatusBadge tone={getStatusBadgeTone(field.status)}>{getStatusLabel(field.status, t)}</StatusBadge>
																			</td>
																			<td className="px-3 py-2 text-right">
																				<div className="inline-flex items-center gap-1">
																					{field.status === 'ignorado' ? (
																						<button
																							type="button"
																							onClick={() => void removeIgnoredField(field)}
																							className="rounded-full border border-[#eadfce] px-2.5 py-1 text-xs font-semibold text-slate-600"
																						>
																							{t('dataDictionary.actions.removeStatus', 'Remover status')}
																						</button>
																					) : null}

																					{field.status === 'nao_disponivel' ? (
																						<button
																							type="button"
																							onClick={() => setIgnoreModalField(field)}
																							className="rounded-full border border-[#eadfce] px-2.5 py-1 text-xs font-semibold text-slate-600"
																						>
																							{t('dataDictionary.actions.ignore', 'Ignorar')}
																						</button>
																					) : null}

																					<button
																						type="button"
																						onClick={() => setFieldEditModal({ mode: 'descricao', field })}
																						className="rounded-full border border-[#eadfce] px-2.5 py-1 text-xs font-semibold text-slate-600"
																					>
																						{t('dataDictionary.tabs.description', 'Descrição')}
																					</button>
																					<button
																						type="button"
																						onClick={() => setFieldEditModal({ mode: 'regra', field })}
																						className="rounded-full border border-[#eadfce] px-2.5 py-1 text-xs font-semibold text-slate-600"
																					>
																						{t('dataDictionary.actions.rule', 'Regra')}
																					</button>
																				</div>
																			</td>
																		</tr>
																	))}
																</tbody>
															</table>
														</div>
													</div>
												) : null}
											</AsyncState>
										) : null}
									</div>
								) : null}

								{activeTab === 'descricao' ? (
									<div className="space-y-3">
										<div className="flex justify-end">
											<button
												type="button"
												onClick={() =>
													setTableEditModal({
														mode: 'descricao',
														value: tableDetailState.data?.descricao || '',
													})
												}
												className="inline-flex items-center gap-2 rounded-full border border-[#e5dbc9] bg-white px-3 py-2 text-xs font-semibold text-slate-700"
											>
												<FileText className="h-3.5 w-3.5" />
												{t('common.edit', 'Editar')}
											</button>
										</div>
										<div
											className="rounded-[1rem] border border-[#ece3d6] bg-white p-4 text-sm text-slate-700"
											dangerouslySetInnerHTML={{ __html: tableDetailState.data.descricao || '-' }}
										/>
									</div>
								) : null}

								{activeTab === 'regras' ? (
									<div className="space-y-3">
										<div className="flex justify-end">
											<button
												type="button"
												onClick={() =>
													setTableEditModal({
														mode: 'regra',
														value: tableDetailState.data?.regra || '',
													})
												}
												className="inline-flex items-center gap-2 rounded-full border border-[#e5dbc9] bg-white px-3 py-2 text-xs font-semibold text-slate-700"
											>
												<FileText className="h-3.5 w-3.5" />
												{t('common.edit', 'Editar')}
											</button>
										</div>
										<div
											className="rounded-[1rem] border border-[#ece3d6] bg-white p-4 text-sm text-slate-700"
											dangerouslySetInnerHTML={{ __html: tableDetailState.data.regra || '-' }}
										/>
									</div>
								) : null}
							</div>
						) : (
							<div className="rounded-[1rem] border border-dashed border-[#e8e1d5] p-6 text-sm text-slate-500">
								{t('dataDictionary.emptyTable', 'Selecione uma tabela para visualizar o detalhe.')}
							</div>
						)}
					</AsyncState>
				</SectionCard>
			</div>

			<OverlayModal
				open={Boolean(ignoreModalField)}
				onClose={() => setIgnoreModalField(null)}
				title={t('dataDictionary.modals.ignoreFieldTitle', 'Ignorar campo')}
				maxWidthClassName="max-w-2xl"
			>
				<div className="space-y-4">
					<p className="text-sm text-slate-600">
						{t('dataDictionary.modals.ignoreFieldDescription', 'Informe a justificativa para ignorar o campo {{field}}.', { field: ignoreModalField?.nome ?? '' })}
					</p>
					<textarea
						value={ignoreObservation}
						onChange={(event) => setIgnoreObservation(event.target.value)}
						rows={4}
						className="w-full rounded-[0.9rem] border border-[#e4dbc9] bg-white px-3 py-2 text-sm"
					/>
					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={() => setIgnoreModalField(null)}
							className="rounded-full border border-[#e5dbc9] bg-white px-4 py-2 text-sm font-semibold text-slate-700"
						>
							{t('common.cancel', 'Cancelar')}
						</button>
						<button
							type="button"
							onClick={() => void ignoreField()}
							disabled={saving || !ignoreObservation.trim()}
							className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
						>
							{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
							{t('common.save', 'Salvar')}
						</button>
					</div>
				</div>
			</OverlayModal>

			<OverlayModal
				open={Boolean(fieldEditModal)}
				onClose={() => setFieldEditModal(null)}
				title={
					fieldEditModal?.mode === 'descricao'
						? t('dataDictionary.modals.fieldDescriptionTitle', 'Descrição do campo')
						: t('dataDictionary.modals.fieldRuleTitle', 'Regra do campo')
				}
				maxWidthClassName="max-w-6xl"
			>
				{fieldEditModal ? (
					<FieldEditor
						initialValue={fieldEditModal.mode === 'descricao' ? fieldEditModal.field.descricao : fieldEditModal.field.regra}
						onCancel={() => setFieldEditModal(null)}
						onSave={(value) => void saveField(fieldEditModal.mode, fieldEditModal.field.id, value)}
						saving={saving}
					/>
				) : null}
			</OverlayModal>

			<OverlayModal
				open={Boolean(tableEditModal)}
				onClose={() => setTableEditModal(null)}
				title={
					tableEditModal?.mode === 'descricao'
						? t('dataDictionary.modals.tableDescriptionTitle', 'Descrição da tabela')
						: t('dataDictionary.modals.tableRuleTitle', 'Regra da tabela')
				}
				maxWidthClassName="max-w-6xl"
			>
				{tableEditModal ? (
					<FieldEditor
						initialValue={tableEditModal.value}
						onCancel={() => setTableEditModal(null)}
						onSave={(value) => void saveTableDetail(tableEditModal.mode, value)}
						saving={saving}
					/>
				) : null}
			</OverlayModal>

			{toast ? <PageToast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null}
		</div>
	);
}

function FieldEditor({ initialValue, onCancel, onSave, saving }: { initialValue: string; onCancel: () => void; onSave: (value: string) => void; saving: boolean }) {
	const { t } = useI18n();
	const [value, setValue] = useState(initialValue);

	return (
		<div className="space-y-4">
			<RichTextEditor value={value} onChange={setValue} />
			<div className="flex justify-end gap-2">
				<button type="button" onClick={onCancel} className="rounded-full border border-[#e5dbc9] bg-white px-4 py-2 text-sm font-semibold text-slate-700">
					{t('common.cancel', 'Cancelar')}
				</button>
				<button
					type="button"
					onClick={() => onSave(value)}
					disabled={saving}
					className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
				>
					{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
					{t('common.save', 'Salvar')}
				</button>
			</div>
		</div>
	);
}
