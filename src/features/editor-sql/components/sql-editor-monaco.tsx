'use client';

import Editor, { type Monaco } from '@monaco-editor/react';
import type { editor as MonacoEditor, IDisposable, Position, Uri } from 'monaco-editor';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUi } from '@/src/contexts/ui-context';

const SQL_KEYWORDS = [
	'SELECT',
	'DISTINCT',
	'FROM',
	'WHERE',
	'GROUP BY',
	'HAVING',
	'ORDER BY',
	'LIMIT',
	'OFFSET',
	'JOIN',
	'LEFT JOIN',
	'INNER JOIN',
	'RIGHT JOIN',
	'FULL JOIN',
	'ON',
	'AND',
	'OR',
	'NOT',
	'IN',
	'BETWEEN',
	'LIKE',
	'ILIKE',
	'IS NULL',
	'IS NOT NULL',
	'EXISTS',
	'CASE',
	'WHEN',
	'THEN',
	'ELSE',
	'END',
	'UNION',
	'UNION ALL',
	'COUNT',
	'SUM',
	'AVG',
	'MIN',
	'MAX',
	'COALESCE',
	'CAST',
	'DATE',
	'NOW()',
	'CURRENT_DATE',
	'CURRENT_TIMESTAMP',
	'INSERT INTO',
	'VALUES',
	'UPDATE',
	'SET',
	'DELETE',
	'WITH',
];

const SQL_FUNCTIONS = [
	'COUNT(*)',
	'SUM(${1:coluna})',
	'AVG(${1:coluna})',
	'MIN(${1:coluna})',
	'MAX(${1:coluna})',
	'COALESCE(${1:valor}, ${2:padrao})',
	'CAST(${1:valor} AS ${2:tipo})',
	'DATE(${1:coluna})',
	'NOW()',
	'CURRENT_DATE',
	'CURRENT_TIMESTAMP',
];

const SQL_SNIPPETS = [
	{
		label: 'SELECT básico',
		detail: 'Consulta inicial com filtro e ordenação',
		insertText: 'SELECT *\nFROM ${1:tabela}\nWHERE ${2:condicao}\nORDER BY ${3:coluna} DESC\nLIMIT ${4:50};',
	},
	{
		label: 'SELECT com JOIN',
		detail: 'Consulta com relacionamento entre tabelas',
		insertText: 'SELECT ${1:a.*}, ${2:b.*}\nFROM ${3:tabela_a} a\nINNER JOIN ${4:tabela_b} b ON b.${5:id} = a.${6:id}\nWHERE ${7:condicao};',
	},
	{
		label: 'CTE',
		detail: 'WITH base AS (...)',
		insertText: 'WITH ${1:base} AS (\n  SELECT ${2:*}\n  FROM ${3:tabela}\n  WHERE ${4:condicao}\n)\nSELECT *\nFROM ${1:base};',
	},
	{
		label: 'Agregação',
		detail: 'GROUP BY com totalização',
		insertText: 'SELECT ${1:coluna}, COUNT(*) AS total\nFROM ${2:tabela}\nGROUP BY ${1:coluna}\nORDER BY total DESC;',
	},
	{
		label: 'CASE WHEN',
		detail: 'Bloco condicional em coluna calculada',
		insertText: 'CASE\n  WHEN ${1:condicao} THEN ${2:resultado}\n  ELSE ${3:resultado_padrao}\nEND AS ${4:alias}',
	},
	{
		label: 'Filtro por período',
		detail: 'Where com data inicial e final',
		insertText: "WHERE ${1:data_coluna} BETWEEN ${2:'2026-01-01 00:00:00'} AND ${3:'2026-01-31 23:59:59'}",
	},
	{
		label: 'IN com lista',
		detail: 'Filtro IN com múltiplos valores',
		insertText: 'WHERE ${1:coluna} IN (${2:1}, ${3:2}, ${4:3})',
	},
	{
		label: 'EXISTS',
		detail: 'Filtro com subconsulta EXISTS',
		insertText: 'WHERE EXISTS (\n  SELECT 1\n  FROM ${1:tabela_relacionada} r\n  WHERE r.${2:chave} = ${3:tabela}.${4:chave}\n)',
	},
	{
		label: 'INSERT',
		detail: 'INSERT INTO com colunas e valores',
		insertText: 'INSERT INTO ${1:tabela} (\n  ${2:coluna_1},\n  ${3:coluna_2}\n) VALUES (\n  ${4:valor_1},\n  ${5:valor_2}\n);',
	},
	{
		label: 'UPDATE',
		detail: 'UPDATE com SET e WHERE',
		insertText: 'UPDATE ${1:tabela}\nSET ${2:coluna} = ${3:valor}\nWHERE ${4:condicao};',
	},
	{
		label: 'DELETE',
		detail: 'DELETE com condição explícita',
		insertText: 'DELETE FROM ${1:tabela}\nWHERE ${2:condicao};',
	},
	{
		label: 'Paginação',
		detail: 'ORDER BY + LIMIT + OFFSET',
		insertText: 'ORDER BY ${1:coluna} DESC\nLIMIT ${2:100}\nOFFSET ${3:0};',
	},
	{
		label: 'Top clientes',
		detail: 'Exemplo de agregação por cliente',
		insertText:
			"SELECT ${1:id_cliente}, COUNT(*) AS pedidos, SUM(${2:valor_total}) AS faturamento\nFROM ${3:pedidos}\nWHERE ${4:created_at} BETWEEN ${5:'2026-01-01'} AND ${6:'2026-01-31'}\nGROUP BY ${1:id_cliente}\nORDER BY faturamento DESC\nLIMIT ${7:20};",
	},
];

type SqlEditorMonacoProps = {
	tabId: string;
	value: string;
	onChange: (value: string) => void;
	onRunShortcut?: (value: string) => void;
	height?: string;
};

const modelUriCache = new Map<string, Uri>();
const viewStateCache = new Map<string, MonacoEditor.ICodeEditorViewState | null>();
let completionProviderRegistered = false;

function getModelUri(monaco: Monaco, tabId: string) {
	const cached = modelUriCache.get(tabId);
	if (cached) return cached;

	const nextUri = monaco.Uri.parse(`inmemory://sql-editor/${tabId}.sql`);
	modelUriCache.set(tabId, nextUri);
	return nextUri;
}

function getOrCreateModel(monaco: Monaco, tabId: string, value: string) {
	const uri = getModelUri(monaco, tabId);
	const existing = monaco.editor.getModel(uri);
	if (existing) return existing;
	return monaco.editor.createModel(value, 'sql', uri);
}

function ensureCompletionProvider(monaco: Monaco) {
	if (completionProviderRegistered) {
		return;
	}

	monaco.languages.registerCompletionItemProvider('sql', {
		provideCompletionItems(model: MonacoEditor.ITextModel, position: Position) {
			const word = model.getWordUntilPosition(position);
			const range = {
				startLineNumber: position.lineNumber,
				endLineNumber: position.lineNumber,
				startColumn: word.startColumn,
				endColumn: word.endColumn,
			};

			return {
				suggestions: [
					...SQL_KEYWORDS.map((keyword) => ({
						label: keyword,
						kind: monaco.languages.CompletionItemKind.Keyword,
						insertText: keyword,
						detail: 'Palavra-chave SQL',
						range,
					})),
					...SQL_FUNCTIONS.map((fn) => ({
						label: fn,
						kind: monaco.languages.CompletionItemKind.Function,
						insertText: fn,
						detail: 'Função SQL',
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						range,
					})),
					...SQL_SNIPPETS.map((snippet) => ({
						label: snippet.label,
						kind: monaco.languages.CompletionItemKind.Snippet,
						insertText: snippet.insertText,
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						detail: snippet.detail,
						documentation: snippet.detail,
						range,
					})),
				],
			};
		},
	});

	completionProviderRegistered = true;
}

export function SqlEditorMonaco({ tabId, value, onChange, onRunShortcut, height = '420px' }: SqlEditorMonacoProps) {
	const { theme } = useUi();
	const containerRef = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
	const monacoRef = useRef<Monaco | null>(null);
	const currentTabIdRef = useRef(tabId);
	const changeSubscriptionRef = useRef<IDisposable | null>(null);
	const onChangeRef = useRef(onChange);
	const shortcutRef = useRef(onRunShortcut);
	const externalValueRef = useRef(value);
	const [editorHeight, setEditorHeight] = useState(420);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		shortcutRef.current = onRunShortcut;
	}, [onRunShortcut]);

	useEffect(() => {
		externalValueRef.current = value;
	}, [value]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || typeof ResizeObserver === 'undefined') {
			return;
		}

		const updateHeight = () => {
			setEditorHeight(Math.max(container.getBoundingClientRect().height, 320));
		};

		updateHeight();

		const observer = new ResizeObserver(() => {
			updateHeight();
		});

		observer.observe(container);

		return () => {
			observer.disconnect();
		};
	}, []);

	useEffect(() => {
		const editor = editorRef.current;
		const monaco = monacoRef.current;

		if (!editor || !monaco) {
			return;
		}

		const previousTabId = currentTabIdRef.current;
		if (previousTabId !== tabId) {
			viewStateCache.set(previousTabId, editor.saveViewState());
			const nextModel = getOrCreateModel(monaco, tabId, value);
			editor.setModel(nextModel);
			const nextViewState = viewStateCache.get(tabId);
			if (nextViewState) {
				editor.restoreViewState(nextViewState);
			}
			editor.focus();
			currentTabIdRef.current = tabId;
		}

		const currentModel = editor.getModel();
		if (!currentModel || value === externalValueRef.current) {
			return;
		}

		if (currentModel.getValue() !== value) {
			currentModel.pushEditOperations([], [{ range: currentModel.getFullModelRange(), text: value }], () => null);
			externalValueRef.current = value;
		}
	}, [tabId, value]);

	useEffect(() => {
		return () => {
			const editor = editorRef.current;
			const currentTabId = currentTabIdRef.current;
			if (editor && currentTabId) {
				viewStateCache.set(currentTabId, editor.saveViewState());
			}
			changeSubscriptionRef.current?.dispose();
		};
	}, []);

	const options = useMemo<MonacoEditor.IStandaloneEditorConstructionOptions>(
		() => ({
			fontSize: 14,
			fontFamily: 'Consolas, "SFMono-Regular", Menlo, Monaco, monospace',
			minimap: { enabled: false },
			scrollBeyondLastLine: false,
			automaticLayout: true,
			wordWrap: 'off',
			tabSize: 2,
			quickSuggestions: {
				other: false,
				comments: false,
				strings: false,
			},
			suggestOnTriggerCharacters: false,
			acceptSuggestionOnEnter: 'smart',
			suggest: {
				showKeywords: true,
				showSnippets: true,
				showFunctions: true,
				localityBonus: true,
			},
			padding: {
				top: 18,
				bottom: 18,
			},
			roundedSelection: true,
			lineNumbersMinChars: 3,
			glyphMargin: false,
			folding: false,
			lineDecorationsWidth: 12,
			renderLineHighlight: 'line',
			overviewRulerBorder: false,
			scrollBeyondLastColumn: 2,
			snippetSuggestions: 'top',
			scrollbar: {
				verticalScrollbarSize: 10,
				horizontalScrollbarSize: 10,
			},
		}),
		[],
	);

	return (
		<div
			ref={containerRef}
			data-testid="sql-editor-monaco"
			className="app-control-muted flex h-full min-h-0 flex-col overflow-hidden rounded-[1.2rem]"
			style={height === '100%' ? undefined : { height }}
		>
			<Editor
				className="h-full"
				height={`${editorHeight}px`}
				defaultLanguage="sql"
				theme={theme === 'dark' ? 'vs-dark' : 'light'}
				beforeMount={(monaco) => {
					ensureCompletionProvider(monaco);
				}}
				onMount={(editor, monaco) => {
					monacoRef.current = monaco;
					editorRef.current = editor;

					const initialModel = getOrCreateModel(monaco, tabId, externalValueRef.current);
					editor.setModel(initialModel);
					const savedViewState = viewStateCache.get(tabId);
					if (savedViewState) {
						editor.restoreViewState(savedViewState);
					}

					changeSubscriptionRef.current?.dispose();
					changeSubscriptionRef.current = editor.onDidChangeModelContent(() => {
						const nextValue = editor.getValue();
						if (nextValue !== externalValueRef.current) {
							externalValueRef.current = nextValue;
							onChangeRef.current(nextValue);
						}
					});

					editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
						shortcutRef.current?.(editor.getValue());
					});

					currentTabIdRef.current = tabId;
					editor.focus();
				}}
				options={options}
				path={`sql-editor-${tabId}.sql`}
			/>
		</div>
	);
}
