'use client'

import Editor, { type Monaco } from '@monaco-editor/react'
import type { editor as MonacoEditor } from 'monaco-editor'
import { useEffect, useMemo, useRef } from 'react'
import { useUi } from '@/src/contexts/ui-context'

type Props = {
	editorId: string
	language: string
	value: string
	onChange: (value: string) => void
	readOnly?: boolean
	height?: string
}

const modelUriCache = new Map<string, string>()

function normalizeMonacoLanguage(language: string) {
	const key = language.trim().toLowerCase()
	const map: Record<string, string> = {
		'c#': 'csharp',
		csharp: 'csharp',
		cs: 'csharp',
		plsql: 'sql',
		sql: 'sql',
		mysql: 'sql',
		sqlserver: 'sql',
		javascript: 'javascript',
		js: 'javascript',
		typescript: 'typescript',
		ts: 'typescript',
		json: 'json',
		razor: 'html',
		xml: 'xml',
		yaml: 'yaml',
		yml: 'yaml',
		php: 'php',
		python: 'python',
		py: 'python',
		html: 'html',
		css: 'css',
		bash: 'shell',
		sh: 'shell',
		powershell: 'powershell',
		ps1: 'powershell',
	}
	return map[key] || 'plaintext'
}

function getModel(monaco: Monaco, editorId: string, language: string, value: string) {
	const normalizedLanguage = normalizeMonacoLanguage(language)
	const cacheKey = `${editorId}:${normalizedLanguage}`
	const cached = modelUriCache.get(cacheKey)
	const uri = cached ? monaco.Uri.parse(cached) : monaco.Uri.parse(`inmemory://erp-scripts/${editorId}.${normalizedLanguage}`)
	if (!cached) {
		modelUriCache.set(cacheKey, uri.toString())
	}

	return monaco.editor.getModel(uri) ?? monaco.editor.createModel(value, normalizedLanguage, uri)
}

export function ScriptCodeEditor({ editorId, language, value, onChange, readOnly = false, height = '420px' }: Props) {
	const { theme } = useUi()
	const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
	const monacoRef = useRef<Monaco | null>(null)
	const onChangeRef = useRef(onChange)
	const externalValueRef = useRef(value)

	useEffect(() => {
		onChangeRef.current = onChange
	}, [onChange])

	useEffect(() => {
		externalValueRef.current = value
	}, [value])

	useEffect(() => {
		const editor = editorRef.current
		const monaco = monacoRef.current
		if (!editor || !monaco) return

		const model = getModel(monaco, editorId, language, value)
		if (editor.getModel() !== model) {
			editor.setModel(model)
		}
		if (model.getValue() !== value) {
			model.pushEditOperations([], [{ range: model.getFullModelRange(), text: value }], () => null)
		}
	}, [editorId, language, value])

	const options = useMemo<MonacoEditor.IStandaloneEditorConstructionOptions>(
		() => ({
			fontSize: 14,
			fontFamily: 'Consolas, "SFMono-Regular", Menlo, Monaco, monospace',
			minimap: { enabled: false },
			scrollBeyondLastLine: false,
			automaticLayout: true,
			wordWrap: 'on',
			tabSize: 2,
			quickSuggestions: true,
			suggestOnTriggerCharacters: true,
			padding: { top: 16, bottom: 16 },
			lineNumbersMinChars: 3,
			glyphMargin: false,
			folding: true,
			lineDecorationsWidth: 12,
			renderLineHighlight: 'line',
			overviewRulerBorder: false,
			readOnly,
			scrollbar: {
				verticalScrollbarSize: 10,
				horizontalScrollbarSize: 10,
			},
		}),
		[readOnly],
	)

	return (
		<div className="app-control-muted flex flex-col overflow-hidden rounded-[1.2rem]" style={{ height }}>
			<Editor
				className="h-full"
				height={height}
				defaultLanguage={normalizeMonacoLanguage(language)}
				theme={theme === 'dark' ? 'vs-dark' : 'light'}
				onMount={(editor, monaco) => {
					editorRef.current = editor
					monacoRef.current = monaco
					editor.setModel(getModel(monaco, editorId, language, externalValueRef.current))
					editor.onDidChangeModelContent(() => {
						const nextValue = editor.getValue()
						if (nextValue !== externalValueRef.current) {
							externalValueRef.current = nextValue
							onChangeRef.current(nextValue)
						}
					})
				}}
				options={options}
				path={`erp-script-${editorId}.${normalizeMonacoLanguage(language)}`}
			/>
		</div>
	)
}
