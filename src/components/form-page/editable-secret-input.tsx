'use client';

import type { ReactNode } from 'react';
import { FieldUpdateMeta, type FieldUpdateMetadata } from '@/src/components/form-page/field-update-meta';
import { inputClasses } from '@/src/components/ui/input-styles';

type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

type Props = {
	value: string;
	initialValue?: string;
	editable: boolean;
	saving: boolean;
	canEdit: boolean;
	metadata?: FieldUpdateMetadata | null;
	onChange: (value: string) => void;
	onEnable: () => void;
	onCancel: () => void;
	t: TranslationFn;
	locale?: string;
	updateLabelKey: string;
	updateFallback: string;
	changeLabelKey: string;
	changeFallback: string;
	cancelLabelKey: string;
	cancelFallback: string;
	inputType?: string;
	placeholder?: string;
	inputClassName?: string;
	metaClassName?: string;
	buttonClassName?: string;
	changeIcon?: ReactNode;
	cancelIcon?: ReactNode;
};

export function EditableSecretInput({
	value,
	initialValue = '',
	editable,
	saving,
	canEdit,
	metadata,
	onChange,
	onEnable,
	onCancel,
	t,
	locale,
	updateLabelKey,
	updateFallback,
	changeLabelKey,
	changeFallback,
	cancelLabelKey,
	cancelFallback,
	inputType = 'text',
	placeholder,
	inputClassName,
	metaClassName,
	buttonClassName = 'app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold',
	changeIcon,
	cancelIcon,
}: Props) {
	const hasExistingValue = initialValue.trim().length > 0;

	return (
		<div className="space-y-2">
			<input
				type={inputType}
				className={inputClassName ?? inputClasses()}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				disabled={saving || !canEdit || !editable}
				placeholder={placeholder}
			/>
			<FieldUpdateMeta
				as="span"
				metadata={metadata}
				t={t}
				locale={locale}
				labelKey={updateLabelKey}
				fallback={updateFallback}
				className={metaClassName ?? 'mt-1 block text-xs text-slate-500'}
			/>
			{canEdit && hasExistingValue ? (
				<div className="flex flex-wrap gap-2">
					{!editable ? (
						<button type="button" onClick={onEnable} disabled={saving} className={buttonClassName}>
							{changeIcon}
							{t(changeLabelKey, changeFallback)}
						</button>
					) : (
						<button type="button" onClick={onCancel} disabled={saving} className={buttonClassName}>
							{cancelIcon}
							{t(cancelLabelKey, cancelFallback)}
						</button>
					)}
				</div>
			) : null}
		</div>
	);
}
