'use client';

import { FieldUpdateMeta, type FieldUpdateMetadata } from '@/src/components/form-page/field-update-meta';
import { CodeEditor } from '@/src/components/ui/code-editor';
import { SectionCard } from '@/src/components/ui/section-card';

type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

type Props = {
	value: string;
	onChange: (value: string) => void;
	readOnly: boolean;
	metadata: FieldUpdateMetadata;
	locale: string;
	t: TranslationFn;
};

export function IntegracaoScriptsFooterTab({ value, onChange, readOnly, metadata, locale, t }: Props) {
	return (
		<SectionCard
			title={t('integrationsScripts.sections.footer.title', 'Footer')}
			description={t('integrationsScripts.sections.footer.description', 'Scripts que ficarão no rodapé do site, antes do fechamento da tag body')}
		>
			<CodeEditor editorId="scripts-footer" language="html" value={value} onChange={onChange} readOnly={readOnly} height="420px" />
			<FieldUpdateMeta
				as="span"
				metadata={metadata}
				t={t}
				locale={locale}
				labelKey="integrationsScripts.lastUpdateValue"
				fallback="Última alteração: {{date}} por {{user}}"
				className="mt-1 block text-xs text-slate-500"
			/>
		</SectionCard>
	);
}
