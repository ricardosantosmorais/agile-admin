'use client';

import { EditableSecretInput } from '@/src/components/form-page/editable-secret-input';
import { FieldUpdateMeta, formatFieldUpdateMeta } from '@/src/components/form-page/field-update-meta';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import { SectionCard } from '@/src/components/ui/section-card';
import type { IntegracaoAtendimentoBranchRow, IntegracaoAtendimentoRecord, IntegracaoAtendimentoValues } from '@/src/features/atendimento/services/integracao-atendimento-mappers';
import { phoneMask } from '@/src/lib/input-masks';

type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

type Props = {
	values: IntegracaoAtendimentoValues;
	initialRecord: IntegracaoAtendimentoRecord;
	branches: IntegracaoAtendimentoBranchRow[];
	saving: boolean;
	canSave: boolean;
	locale: string;
	t: TranslationFn;
	tokenEditable: boolean;
	hasToken: boolean;
	onPatchValues: (patch: Partial<IntegracaoAtendimentoValues>) => void;
	onUpdateBranch: (index: number, patch: Partial<IntegracaoAtendimentoBranchRow>) => void;
	onSetTokenEditable: (editable: boolean) => void;
};

export function IntegracaoAtendimentoWhatsappTab({
	values,
	initialRecord,
	branches,
	saving,
	canSave,
	locale,
	t,
	tokenEditable,
	hasToken,
	onPatchValues,
	onUpdateBranch,
	onSetTokenEditable,
}: Props) {
	return (
		<SectionCard
			title={t('integrationsAttendance.sections.whatsapp.title', 'WhatsApp')}
			description={t('integrationsAttendance.sections.whatsapp.description', 'Configure números por filial e o gateway usado para mensagens transacionais.')}
		>
			<div className="app-table-shell overflow-x-auto rounded-[1.2rem]">
				<table className="min-w-180 w-full border-collapse">
					<thead>
						<tr className="app-table-muted text-left text-xs uppercase tracking-[0.08em] text-slate-500">
							<th className="px-4 py-3">{t('integrationsAttendance.fields.branch', 'Filial')}</th>
							<th className="px-4 py-3">{t('integrationsAttendance.fields.whatsappNumber', 'Número')}</th>
							<th className="px-4 py-3">{t('integrationsAttendance.fields.whatsappNumberId', 'ID Número')}</th>
							<th className="px-4 py-3">{t('integrationsAttendance.fields.lastUpdate', 'Última alteração')}</th>
						</tr>
					</thead>
					<tbody>
						{branches.map((branch, index) => (
							<tr key={branch.id || `branch-${index}`} className="app-table-row-hover border-t border-line align-top">
								<td className="px-4 py-3 text-sm font-semibold text-slate-800">
									{branch.nome} - {branch.id}
								</td>
								<td className="px-4 py-3">
									<input
										type="text"
										value={branch.whatsappNumero}
										onChange={(event) => onUpdateBranch(index, { whatsappNumero: phoneMask(event.target.value, event.target.value.replace(/\D/g, '').length > 10) })}
										className={inputClasses()}
										placeholder="(99) 99999-9999"
										disabled={saving || !canSave}
									/>
								</td>
								<td className="px-4 py-3">
									<input
										type="text"
										value={branch.whatsappIdNumero}
										onChange={(event) => onUpdateBranch(index, { whatsappIdNumero: event.target.value })}
										className={inputClasses()}
										disabled={saving || !canSave}
									/>
								</td>
								<td className="px-4 py-3 text-xs text-slate-500">
									{formatFieldUpdateMeta({
										metadata: branch.whatsappNumeroMeta,
										t,
										locale,
										labelKey: 'integrationsAttendance.fields.lastUpdateValue',
										fallback: 'Última alteração: {{date}} por {{user}}',
									}) ?? '-'}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<p className="mt-3 text-xs leading-5 text-slate-500">
				{t(
					'integrationsAttendance.helpers.whatsappBranchNotes',
					'* Número do WhatsApp que será vinculado ao botão flutuante no site. ** ID do Número do WhatsApp que será utilizado para disparo de mensagens transacionais (exclusivo Meta).',
				)}
			</p>

			<div className="mt-5 grid gap-4 lg:grid-cols-2">
				<FormField
					label={t('integrationsAttendance.fields.whatsappDisplay', 'Exibição do botão')}
					helperText={t('integrationsAttendance.helpers.whatsappDisplay', 'Lado de exibição do botão flutuante no site.')}
				>
					<>
						<select
							id="whatsapp_exibicao"
							className={inputClasses()}
							value={values.whatsappExibicao}
							onChange={(event) => onPatchValues({ whatsappExibicao: event.target.value })}
							disabled={saving || !canSave}
						>
							<option value="">{t('integrationsAttendance.options.hidden', 'Não exibir')}</option>
							<option value="lado_direito">{t('integrationsAttendance.options.right', 'Lado direito')}</option>
							<option value="lado_esquerdo">{t('integrationsAttendance.options.left', 'Lado esquerdo')}</option>
						</select>
						<FieldUpdateMeta
							as="span"
							metadata={initialRecord.metadata.whatsappExibicao}
							t={t}
							locale={locale}
							labelKey="integrationsAttendance.fields.lastUpdateValue"
							fallback="Última alteração: {{date}} por {{user}}"
							className="text-xs text-slate-500"
						/>
					</>
				</FormField>

				<FormField
					label={t('integrationsAttendance.fields.whatsappGateway', 'API Gateway')}
					helperText={t('integrationsAttendance.helpers.whatsappGateway', 'Gateway que será utilizado para conectar com a API do WhatsApp.')}
				>
					<>
						<select
							id="whatsapp_gateway"
							className={inputClasses()}
							value={values.whatsappGateway}
							onChange={(event) => onPatchValues({ whatsappGateway: event.target.value })}
							disabled={saving || !canSave}
						>
							<option value="">{t('common.selectOption', 'Selecione')}</option>
							<option value="meta">{t('integrationsAttendance.options.gatewayMeta', 'Meta (API oficial)')}</option>
							<option value="whatsgw">{t('integrationsAttendance.options.gatewayWhatsGw', 'WhatsGW')}</option>
						</select>
						<FieldUpdateMeta
							as="span"
							metadata={initialRecord.metadata.whatsappGateway}
							t={t}
							locale={locale}
							labelKey="integrationsAttendance.fields.lastUpdateValue"
							fallback="Última alteração: {{date}} por {{user}}"
							className="text-xs text-slate-500"
						/>
					</>
				</FormField>
			</div>

			<div className="mt-4">
				<FormField
					label={t('integrationsAttendance.fields.whatsappToken', 'Token de API')}
					helperText={t('integrationsAttendance.helpers.whatsappToken', 'Token de acesso gerado pelo gateway para envio de mensagens transacionais.')}
				>
					<EditableSecretInput
						value={values.whatsappApiToken}
						initialValue={initialRecord.values.whatsappApiToken}
						editable={tokenEditable || !hasToken}
						saving={saving}
						canEdit={canSave}
						metadata={initialRecord.metadata.whatsappApiToken}
						onChange={(value) => onPatchValues({ whatsappApiToken: value })}
						onEnable={() => onSetTokenEditable(true)}
						onCancel={() => {
							onSetTokenEditable(false);
							onPatchValues({ whatsappApiToken: initialRecord.values.whatsappApiToken });
						}}
						t={t}
						locale={locale}
						updateLabelKey="integrationsAttendance.fields.lastUpdateValue"
						updateFallback="Última alteração: {{date}} por {{user}}"
						changeLabelKey="integrationsAttendance.actions.changeToken"
						changeFallback="Alterar token"
						cancelLabelKey="common.cancel"
						cancelFallback="Cancelar"
						placeholder={t('integrationsAttendance.placeholders.whatsappToken', 'Informe o token de acesso')}
						buttonClassName="app-button-secondary"
						metaClassName="text-xs text-slate-500"
					/>
				</FormField>
			</div>

			<div className="app-pane-muted rounded-[1.1rem] p-5">
				<h4 className="text-lg font-semibold text-slate-900">
					{t('integrationsAttendance.instructions.title', 'Como conectar sua conta do WhatsApp à plataforma através da Meta')}
				</h4>
				<ol className="mt-3 space-y-2 pl-5 text-sm leading-6 text-slate-700 marker:font-semibold marker:text-slate-700">
					<li>
						{t('integrationsAttendance.instructions.step1Prefix', 'Acesse o painel da Meta em')}{' '}
						<a
							href="https://developers.facebook.com/apps"
							target="_blank"
							rel="noreferrer"
							className="font-semibold text-sky-700 underline underline-offset-2 transition hover:text-sky-800 dark:text-sky-300"
						>
							developers.facebook.com/apps
						</a>
						.
					</li>
					<li>{t('integrationsAttendance.instructions.step2', 'Crie um App do tipo Negócios ou selecione um já existente.')}</li>
					<li>{t('integrationsAttendance.instructions.step3', 'No menu esquerdo, clique em "Adicionar produto" e selecione WhatsApp.')}</li>
					<li>{t('integrationsAttendance.instructions.step4', 'Vá em WhatsApp > Configuração e conecte sua conta do WhatsApp Business.')}</li>
					<li>
						{t('integrationsAttendance.instructions.step5', 'Adicione um número de telefone (não pode estar ativo no WhatsApp).')}
						<p className="mt-1 text-xs text-slate-500">{t('integrationsAttendance.instructions.step5Helper', 'Você receberá um código por SMS ou ligação para confirmar.')}</p>
					</li>
					<li>
						{t('integrationsAttendance.instructions.step6', 'Após a verificação, copie os dois dados abaixo:')}
						<ul className="mt-2 list-disc space-y-1 pl-5">
							<li className="font-semibold text-slate-800">{t('integrationsAttendance.instructions.phoneNumberId', 'Phone Number ID')}</li>
							<li className="font-semibold text-slate-800">
								{t('integrationsAttendance.instructions.accessToken', 'Access Token')}{' '}
								<span className="font-normal text-slate-600">{t('integrationsAttendance.instructions.accessTokenValidity', '(válido por 60 dias)')}</span>
							</li>
						</ul>
					</li>
					<li>{t('integrationsAttendance.instructions.step7', 'Cole esses dados aqui na plataforma para ativar o envio automático de mensagens.')}</li>
				</ol>
				<p className="mt-4 text-sm text-slate-600">
					{t('integrationsAttendance.instructions.tip', 'Dica: salve o Access Token com a data de validade. A renovação pode ser feita pelo mesmo processo após 60 dias.')}
				</p>
			</div>
		</SectionCard>
	);
}
