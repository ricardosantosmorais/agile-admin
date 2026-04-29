'use client';

import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { useEffect, useMemo, useRef } from 'react';
import { useUi } from '@/src/contexts/ui-context';

type CodeEditorLanguage = 'html' | 'css' | 'json' | 'sql';

type CodeEditorProps = {
	editorId: string;
	language: CodeEditorLanguage;
	value: string;
	onChange: (value: string) => void;
	height?: string;
	readOnly?: boolean;
};

const modelUriCache = new Map<string, string>();
const viewStateCache = new Map<string, MonacoEditor.ICodeEditorViewState | null>();

function getModelUri(monaco: Monaco, editorId: string, language: CodeEditorLanguage) {
	const cacheKey = `${language}:${editorId}`;
	const cached = modelUriCache.get(cacheKey);
	if (cached) {
		return monaco.Uri.parse(cached);
	}

	const uri = monaco.Uri.parse(`inmemory://code-editor/${editorId}.${language}`);
	modelUriCache.set(cacheKey, uri.toString());
	return uri;
}

function getOrCreateModel(monaco: Monaco, editorId: string, language: CodeEditorLanguage, value: string) {
	const uri = getModelUri(monaco, editorId, language);
	const existing = monaco.editor.getModel(uri);
	if (existing) {
		return existing;
	}

	return monaco.editor.createModel(value, language, uri);
}

export function CodeEditor({ editorId, language, value, onChange, height = '100%', readOnly = false }: CodeEditorProps) {
	const { theme } = useUi();
	const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
	const monacoRef = useRef<Monaco | null>(null);
	const externalValueRef = useRef(value);
	const currentEditorIdRef = useRef(editorId);
	const onChangeRef = useRef(onChange);

	useEffect(() => {
		externalValueRef.current = value;
	}, [value]);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		const editor = editorRef.current;
		const monaco = monacoRef.current;
		if (!editor || !monaco) {
			return;
		}

		const previousEditorId = currentEditorIdRef.current;
		const model = getOrCreateModel(monaco, editorId, language, value);
		if (editor.getModel() !== model) {
			const previousViewState = editor.saveViewState();
			if (previousViewState) {
				viewStateCache.set(previousEditorId, previousViewState);
			}

			editor.setModel(model);

			const savedViewState = viewStateCache.get(editorId);
			if (savedViewState) {
				editor.restoreViewState(savedViewState);
			}

			currentEditorIdRef.current = editorId;
		}

		if (model.getValue() !== value) {
			model.pushEditOperations([], [{ range: model.getFullModelRange(), text: value }], () => null);
		}
	}, [editorId, language, value]);

	const options = useMemo<MonacoEditor.IStandaloneEditorConstructionOptions>(
		() => ({
			fontSize: 13,
			fontFamily: 'Consolas, "SFMono-Regular", Menlo, Monaco, monospace',
			minimap: { enabled: false },
			scrollBeyondLastLine: false,
			automaticLayout: true,
			wordWrap: 'off',
			tabSize: 2,
			quickSuggestions: false,
			suggestOnTriggerCharacters: false,
			snippetSuggestions: 'none',
			padding: {
				top: 16,
				bottom: 16,
			},
			roundedSelection: true,
			lineNumbersMinChars: 3,
			glyphMargin: false,
			folding: true,
			lineDecorationsWidth: 12,
			renderLineHighlight: 'line',
			overviewRulerBorder: false,
			scrollbar: {
				verticalScrollbarSize: 10,
				horizontalScrollbarSize: 10,
			},
			readOnly,
		}),
		[readOnly],
	);

	const hasAutoHeight = height === '100%';

	return (
		<div className={`app-control-muted flex flex-col overflow-hidden rounded-[1.2rem] ${hasAutoHeight ? 'h-full min-h-136' : ''}`} style={hasAutoHeight ? undefined : { height }}>
			<Editor
				className="h-full"
				height={hasAutoHeight ? '100%' : height}
				defaultLanguage={language}
				theme={theme === 'dark' ? 'vs-dark' : 'light'}
				beforeMount={(monaco) => {
					monaco.languages.html.htmlDefaults.setOptions({
						format: {
							tabSize: 2,
							insertSpaces: true,
							wrapLineLength: 120,
						},
					});
				}}
				onMount={(editor, monaco) => {
					monacoRef.current = monaco;
					editorRef.current = editor;

					const model = getOrCreateModel(monaco, editorId, language, externalValueRef.current);
					editor.setModel(model);

					const savedViewState = viewStateCache.get(editorId);
					if (savedViewState) {
						editor.restoreViewState(savedViewState);
					}

					editor.onDidChangeModelContent(() => {
						const nextValue = editor.getValue();
						if (nextValue !== externalValueRef.current) {
							externalValueRef.current = nextValue;
							onChangeRef.current(nextValue);
						}
					});

					currentEditorIdRef.current = editorId;
				}}
				options={options}
				path={`code-editor-${editorId}.${language}`}
			/>
		</div>
	);
}
