'use client';

import type { ElementType, ReactNode } from 'react';
import { formatDateTime } from '@/src/lib/date-time';

export type FieldUpdateMetadata = {
	updatedAt?: string;
	updatedBy?: string;
};

type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

type FormatFieldUpdateMetaOptions = {
	metadata?: FieldUpdateMetadata | null;
	t: TranslationFn;
	labelKey: string;
	fallback: string;
	locale?: string;
};

type FieldUpdateMetaProps<TElement extends ElementType = 'p'> = {
	as?: TElement;
	metadata?: FieldUpdateMetadata | null;
	t: TranslationFn;
	labelKey: string;
	fallback: string;
	locale?: string;
	className?: string;
};

export function hasFieldUpdateMeta(metadata?: FieldUpdateMetadata | null) {
	return Boolean(metadata?.updatedAt && metadata?.updatedBy);
}

export function formatFieldUpdateMeta({ metadata, t, labelKey, fallback, locale }: FormatFieldUpdateMetaOptions) {
	if (!metadata?.updatedAt || !metadata.updatedBy) {
		return null;
	}

	return t(labelKey, fallback, {
		date: formatDateTime(metadata.updatedAt, locale),
		user: metadata.updatedBy,
	});
}

export function FieldUpdateMeta<TElement extends ElementType = 'p'>({
	as,
	metadata,
	t,
	labelKey,
	fallback,
	locale,
	className = 'text-(--app-muted) mt-2 text-xs leading-5',
}: FieldUpdateMetaProps<TElement>) {
	const message = formatFieldUpdateMeta({ metadata, t, labelKey, fallback, locale });

	if (!message) {
		return null;
	}

	const Component = (as ?? 'p') as ElementType;
	return <Component className={className}>{message as ReactNode}</Component>;
}
