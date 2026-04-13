'use client';

import Link from 'next/link';
import { LoaderCircle, Save } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FieldUpdateMeta } from '@/src/components/form-page/field-update-meta';
import { AsyncState } from '@/src/components/ui/async-state';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import { LookupSelect } from '@/src/components/ui/lookup-select';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { SectionCard } from '@/src/components/ui/section-card';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility';
import { useFormState } from '@/src/hooks/use-form-state';
import { useI18n } from '@/src/i18n/use-i18n';
import { httpClient } from '@/src/services/http/http-client';

type FieldMetadata = {
	updatedAt: string;
	updatedBy: string;
};

type LookupSelectOption = {
	id: string;
	label: string;
};

type LookupOption = {
	value: string;
	label?: string;
	fallbackLabel?: string;
};

type LookupCollections = Record<string, LookupOption[]>;

type FieldDefinition<FormValues extends Record<string, string>, Collections extends LookupCollections> = {
	key: keyof FormValues;
	section: string;
	type: 'text' | 'secret' | 'enum' | 'lookup' | 'boolean';
	label: string;
	layoutClassName?: string;
	helper?: string;
	inputMode?: 'text' | 'numeric' | 'decimal';
	placeholder?: string;
	options?: Array<{ value: string; label: string }>;
	lookupCollection?: keyof Collections;
	lookupResource?: string;
	includeEmptyOption?: boolean;
};

type SectionMeta = {
	key: string;
	title: string;
	description: string;
};

const primaryButtonDisabledClasses = 'disabled:cursor-not-allowed disabled:opacity-60';
const LEGACY_LOCKED_TENANT_ID = '1705083119553379';

function maskSecretValue(value: string, editable: boolean) {
	if (editable) {
		return value;
	}

	const normalized = value.trim();
	if (!normalized) {
		return '********';
	}

	if (normalized.length <= 8) {
		return `${normalized.slice(0, 2)}****${normalized.slice(-2)}`;
	}

	return `${normalized.slice(0, 4)}******${normalized.slice(-4)}`;
}

function mapLookupOptions(collection: LookupOption[]): LookupSelectOption[] {
	return collection.map((item) => ({
		id: item.value,
		label: item.label || item.fallbackLabel || item.value,
	}));
}

async function loadLookupResourceOptions(resource: string, query: string, page: number, perPage: number) {
	const params = new URLSearchParams({
		page: String(page),
		perPage: String(perPage),
	});

	if (query.trim()) {
		params.set('q', query.trim());
	}

	return httpClient<LookupSelectOption[]>(`/api/lookups/${resource}?${params.toString()}`, {
		method: 'GET',
		cache: 'no-store',
	});
}

type Props<FormValues extends Record<string, string>, Collections extends LookupCollections, Context = undefined> = {
	featureKey: Parameters<typeof useFeatureAccess>[0];
	moduleTitle: string;
	modulePath: string;
	moduleSectionTitle?: string;
	moduleSectionPath?: string;
	backHref?: string;
	moduleDescription: string;
	contextTitle: string;
	contextValue: string;
	contextDescription: string;
	loadErrorMessage: string;
	saveErrorMessage: string;
	saveSuccessMessage: string;
	fieldDefinitions: FieldDefinition<FormValues, Collections>[];
	resolveFieldDefinitions?: (context: Context | undefined) => FieldDefinition<FormValues, Collections>[];
	sectionOrder: SectionMeta[];
	renderSectionContent?: (section: SectionMeta, values: FormValues, context: Context | undefined) => ReactNode;
	createEmptyValues: () => FormValues;
	emptyLookups: Collections;
	client: {
		get: () => Promise<{
			values: FormValues;
			metadata: Partial<Record<keyof FormValues, FieldMetadata>>;
			lookups?: Collections;
			context?: Context;
		}>;
		save: (initialValues: FormValues, currentValues: FormValues, context: Context | undefined) => Promise<unknown>;
	};
};

export function ParameterFormPageBase<FormValues extends Record<string, string>, Collections extends LookupCollections, Context = undefined>({
	featureKey,
	moduleTitle,
	modulePath,
	moduleSectionTitle,
	moduleSectionPath,
	backHref = '/configuracoes',
	moduleDescription,
	contextTitle,
	contextValue,
	contextDescription,
	loadErrorMessage,
	saveErrorMessage,
	saveSuccessMessage,
	fieldDefinitions,
	resolveFieldDefinitions,
	sectionOrder,
	renderSectionContent,
	createEmptyValues,
	emptyLookups,
	client,
}: Props<FormValues, Collections, Context>) {
	const { locale, t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess(featureKey);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [metadata, setMetadata] = useState<Partial<Record<keyof FormValues, FieldMetadata>>>({});
	const [initialValues, setInitialValues] = useState<FormValues>(createEmptyValues());
	const [lookups, setLookups] = useState<Collections>(emptyLookups);
	const [context, setContext] = useState<Context | undefined>(undefined);
	const [editableSecrets, setEditableSecrets] = useState<Partial<Record<keyof FormValues, boolean>>>({});
	const emptyLookupsRef = useRef(emptyLookups);
	const { state: values, setState: setValues, patch } = useFormState<FormValues>(initialValues);
	const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>();
	const formId = `${modulePath.replaceAll('/', '-')}-form`;
	const canSave = access.canEdit && !(session?.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user?.master);

	const effectiveFieldDefinitions = useMemo(() => resolveFieldDefinitions?.(context) ?? fieldDefinitions, [context, fieldDefinitions, resolveFieldDefinitions]);

	const breadcrumbs = useMemo(
		() => [
			{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
			{ label: moduleSectionTitle ?? t('routes.configuracoes', 'Configurações'), href: moduleSectionPath ?? '/configuracoes' },
			{ label: moduleTitle, href: modulePath },
		],
		[modulePath, moduleSectionPath, moduleSectionTitle, moduleTitle, t],
	);

	const hasChanges = useMemo(
		() =>
			effectiveFieldDefinitions.some((field) => {
				const initialValue = String(initialValues[field.key] ?? '').trim();
				const currentValue = String(values[field.key] ?? '').trim();
				return initialValue !== currentValue;
			}),
		[effectiveFieldDefinitions, initialValues, values],
	);

	useEffect(() => {
		emptyLookupsRef.current = emptyLookups;
	}, [emptyLookups]);

	useEffect(() => {
		setEditableSecrets({});
	}, [initialValues]);

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const result = await client.get();
				if (!active) {
					return;
				}

				setValues(result.values);
				setInitialValues(result.values);
				setMetadata(result.metadata);
				setLookups(result.lookups ?? emptyLookupsRef.current);
				setContext(result.context);
				setError(null);
			} catch (loadError) {
				if (!active) {
					return;
				}

				setError(loadError instanceof Error ? loadError : new Error(loadErrorMessage));
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, [client, loadErrorMessage, setValues]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!canSave || !hasChanges) {
			return;
		}

		try {
			setSaving(true);
			await client.save(initialValues, values, context);
			const refreshed = await client.get();
			setValues(refreshed.values);
			setInitialValues(refreshed.values);
			setMetadata(refreshed.metadata);
			setLookups(refreshed.lookups ?? emptyLookupsRef.current);
			setContext(refreshed.context);
			setFeedback(saveSuccessMessage);
		} catch (saveError) {
			setFeedback(saveError instanceof Error ? saveError.message : saveErrorMessage);
		} finally {
			setSaving(false);
		}
	}

	if (!access.canOpen) {
		return <AccessDeniedState title={moduleTitle} backHref="/dashboard" />;
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={breadcrumbs}
				actions={
					<div className="flex flex-wrap gap-2">
						{canSave && !isFooterVisible ? (
							<button
								type="submit"
								form={formId}
								disabled={!hasChanges || saving}
								className={`app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${primaryButtonDisabledClasses}`}
							>
								{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
								{t('common.save', 'Salvar')}
							</button>
						) : null}
						<Link href={backHref} className="app-button-secondary inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold">
							{t('common.back', 'Voltar')}
						</Link>
					</div>
				}
			/>

			<AsyncState isLoading={loading} error={error?.message}>
				<PageToast message={feedback} onClose={() => setFeedback(null)} />

				<form id={formId} onSubmit={handleSubmit} className="space-y-5">
					<SectionCard title={moduleTitle} description={moduleDescription}>
						<div className="app-pane-muted rounded-2xl px-4 py-3 text-sm">
							<p className="text-(--app-muted) text-xs font-semibold uppercase tracking-[0.22em]">{contextTitle}</p>
							<p className="text-(--app-text) mt-2 text-sm font-medium">{contextValue}</p>
							<p className="text-(--app-muted) mt-2 text-sm leading-6">{contextDescription}</p>
						</div>
					</SectionCard>

					{sectionOrder.map((section) => (
						<SectionCard key={section.key} title={section.title} description={section.description}>
							<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
								{effectiveFieldDefinitions
									.filter((field) => field.section === section.key)
									.map((field) => {
										const fieldMeta = metadata[field.key];
										const lookupCollectionKey = field.lookupCollection;
										const lookupOptions = lookupCollectionKey ? mapLookupOptions(lookups[lookupCollectionKey] ?? []) : [];
										const fieldWrapperClassName = field.layoutClassName ?? 'w-full';

										return (
											<div key={String(field.key)} className={`app-control-muted rounded-[1.15rem] p-4 ${fieldWrapperClassName}`}>
												<FormField label={field.label} asLabel={false}>
													{field.type === 'lookup' ? (
														<LookupSelect<LookupSelectOption>
															label={field.label}
															value={lookupOptions.find((option) => option.id === values[field.key]) ?? null}
															onChange={(nextValue) => {
																patch(field.key, (nextValue?.id ?? '') as FormValues[keyof FormValues]);

																if (!lookupCollectionKey) {
																	return;
																}

																setLookups((currentLookups) => {
																	const currentCollection = currentLookups[lookupCollectionKey] ?? [];

																	if (!nextValue) {
																		return {
																			...currentLookups,
																			[lookupCollectionKey]: currentCollection,
																		};
																	}

																	const nextCollection = [
																		{
																			value: nextValue.id,
																			label: nextValue.label,
																		},
																		...currentCollection.filter((option: LookupOption) => option.value !== nextValue.id),
																	];

																	return {
																		...currentLookups,
																		[lookupCollectionKey]: nextCollection,
																	};
																});
															}}
															disabled={!canSave}
															loadOptions={async (query, page, perPage) => {
																if (field.lookupResource) {
																	return loadLookupResourceOptions(field.lookupResource, query, page, perPage);
																}

																const normalizedQuery = query.trim().toLowerCase();
																const filteredOptions = !normalizedQuery ? lookupOptions : lookupOptions.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
																const start = (page - 1) * perPage;
																const end = start + perPage;
																return filteredOptions.slice(start, end);
															}}
														/>
													) : field.type === 'enum' || field.type === 'boolean' ? (
														<select
															value={values[field.key] ?? ''}
															onChange={(event) => patch(field.key, event.target.value as FormValues[keyof FormValues])}
															disabled={!canSave}
															className={inputClasses()}
														>
															{field.includeEmptyOption !== false ? <option value="">{t('common.select', 'Selecione')}</option> : null}
															{field.options?.map((option) => (
																<option key={`${String(field.key)}-${option.value}`} value={option.value}>
																	{option.label}
																</option>
															))}
														</select>
													) : field.type === 'secret' ? (
														(() => {
															const hasSecret = String(initialValues[field.key] ?? '').trim().length > 0;
															const isEditable = Boolean(editableSecrets[field.key]) || !hasSecret;

															return (
																<div className="space-y-2">
																	<input
																		value={maskSecretValue(String(values[field.key] ?? ''), isEditable)}
																		onChange={(event) => patch(field.key, event.target.value as FormValues[keyof FormValues])}
																		readOnly={!canSave || (hasSecret && !isEditable)}
																		inputMode={field.inputMode}
																		placeholder={field.placeholder}
																		className={inputClasses()}
																	/>
																	{canSave && hasSecret ? (
																		<div className="flex flex-wrap gap-2 pt-1">
																			{!isEditable ? (
																				<button
																					type="button"
																					className="app-button-secondary inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
																					onClick={() => {
																						setEditableSecrets((current) => ({ ...current, [field.key]: true }));
																						patch(field.key, '' as FormValues[keyof FormValues]);
																					}}
																				>
																					{t('common.change', 'Alterar')}
																				</button>
																			) : (
																				<button
																					type="button"
																					className="app-button-secondary inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
																					onClick={() => {
																						setEditableSecrets((current) => ({ ...current, [field.key]: false }));
																						patch(field.key, String(initialValues[field.key] ?? '') as FormValues[keyof FormValues]);
																					}}
																				>
																					{t('common.cancelChange', 'Cancelar alteração')}
																				</button>
																			)}
																		</div>
																	) : null}
																</div>
															);
														})()
													) : (
														<input
															value={values[field.key] ?? ''}
															onChange={(event) => patch(field.key, event.target.value as FormValues[keyof FormValues])}
															readOnly={!canSave}
															inputMode={field.inputMode}
															placeholder={field.placeholder}
															className={inputClasses()}
														/>
													)}
												</FormField>

												{field.helper ? <p className="text-(--app-muted) mt-2 text-xs leading-5">{field.helper}</p> : null}
												<FieldUpdateMeta metadata={fieldMeta} t={t} locale={locale} labelKey="configuracoes.home.lastUpdated" fallback="Última alteração: {{date}} por {{user}}" />
											</div>
										);
									})}
							</div>
							{renderSectionContent ? renderSectionContent(section, values, context) : null}
						</SectionCard>
					))}

					{canSave ? (
						<div ref={footerRef} className="flex flex-wrap justify-center gap-3">
							<button
								type="submit"
								disabled={!hasChanges || saving}
								className={`app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${primaryButtonDisabledClasses}`}
							>
								{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
								{t('common.save', 'Salvar')}
							</button>
							<Link href={backHref} className="app-button-secondary inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold">
								{t('common.cancel', 'Cancelar')}
							</Link>
						</div>
					) : null}
				</form>
			</AsyncState>
		</div>
	);
}
