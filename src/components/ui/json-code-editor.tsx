'use client'

import { ScriptCodeEditor } from '@/src/features/integracao-com-erp-scripts/components/script-code-editor'

type Props = {
	id: string
	value: string
	onChange: (value: string) => void
	readOnly?: boolean
	height?: string
}

export function JsonCodeEditor({ id, value, onChange, readOnly = false, height = '360px' }: Props) {
	return (
		<ScriptCodeEditor
			editorId={`json-${id}`}
			language="json"
			value={value}
			onChange={onChange}
			readOnly={readOnly}
			height={height}
		/>
	)
}
