'use client'

import Editor, { type Monaco } from '@monaco-editor/react'
import type { editor as MonacoEditor, IDisposable, languages as MonacoLanguages, Position } from 'monaco-editor'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { EmailTemplateValidationIssue } from '@/src/features/emails-templates/services/emails-templates-validator'

type EmailTemplateMonacoProps = {
  value: string
  language: 'html' | 'php'
  variables: string[]
  onChange: (value: string) => void
  height?: string
}

export type EmailTemplateMonacoHandle = {
  insertTextAtCursor: (text: string) => void
  setValidationIssues: (issues: EmailTemplateValidationIssue[]) => void
}

const modelUriCache = new Map<string, string>()
const viewStateCache = new Map<string, MonacoEditor.ICodeEditorViewState | null>()
let completionRegistered = false

function getResolvedLanguage() {
  return 'html'
}

function getModelUri(monaco: Monaco, editorId: string, language: 'html' | 'php') {
  const cacheKey = `${language}:${editorId}`
  const cached = modelUriCache.get(cacheKey)
  if (cached) {
    return monaco.Uri.parse(cached)
  }

  const extension = language === 'php' ? 'php' : 'html'
  const uri = monaco.Uri.parse(`inmemory://email-template-editor/${editorId}.${extension}`)
  modelUriCache.set(cacheKey, uri.toString())
  return uri
}

function getOrCreateModel(monaco: Monaco, editorId: string, language: 'html' | 'php', value: string) {
  const uri = getModelUri(monaco, editorId, language)
  const existing = monaco.editor.getModel(uri)
  if (existing) {
    return existing
  }

  return monaco.editor.createModel(value, getResolvedLanguage(), uri)
}

function ensureCompletionProvider(monaco: Monaco, variableRef: { current: string[] }) {
  if (completionRegistered) {
    return
  }

  const triggerCharacters = ['{', '.', '[', '$', '<', '/']
  const provider: MonacoLanguages.CompletionItemProvider = {
    triggerCharacters,
    provideCompletionItems(model: MonacoEditor.ITextModel, position: Position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }

      const variableSuggestions = (variableRef.current || []).map((path) => ({
        label: `{{ ${path} }}`,
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: `{{ ${path} }}`,
        detail: 'Variável do payload',
        range,
      }))

      const snippetSuggestions = [
        {
          label: 'HTML base',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8" />\n  <title>${1:Título}</title>\n</head>\n<body>\n  ${2}\n</body>\n</html>',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Estrutura HTML básica',
          range,
        },
        {
          label: '{{ }}',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '{{ ${1:variavel} }}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Expressão Twig',
          range,
        },
        {
          label: '{% if %}',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '{% if ${1:condicao} %}\n  ${2}\n{% endif %}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Bloco condicional Twig',
          range,
        },
        {
          label: '{% for %}',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '{% for ${1:item} in ${2:colecao} %}\n  ${3}\n{% endfor %}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: 'Loop Twig',
          range,
        },
      ]

      return {
        suggestions: [...snippetSuggestions, ...variableSuggestions],
      }
    },
  }

  monaco.languages.registerCompletionItemProvider('html', provider)
  completionRegistered = true
}

export const EmailTemplateMonaco = forwardRef<EmailTemplateMonacoHandle, EmailTemplateMonacoProps>(function EmailTemplateMonaco(
  { value, language, variables, onChange, height = '100%' },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const changeSubscriptionRef = useRef<IDisposable | null>(null)
  const externalValueRef = useRef(value)
  const currentEditorIdRef = useRef(`template-${language}`)
  const onChangeRef = useRef(onChange)
  const variablesRef = useRef<string[]>(variables)
  const [editorHeight, setEditorHeight] = useState(320)

  useEffect(() => {
    externalValueRef.current = value
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    variablesRef.current = variables
  }, [variables])

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') {
      return
    }

    const updateHeight = () => {
      const bounds = container.getBoundingClientRect()
      setEditorHeight(Math.max(bounds.height, 320))
    }

    updateHeight()

    const observer = new ResizeObserver(() => {
      updateHeight()
      requestAnimationFrame(() => {
        editorRef.current?.layout()
      })
    })

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [])

  useImperativeHandle(ref, () => ({
    insertTextAtCursor(text: string) {
      const editor = editorRef.current
      if (!editor) {
        return
      }

      const selection = editor.getSelection()
      if (!selection) {
        return
      }

      editor.focus()
      editor.executeEdits('email-template-variable-insert', [{
        range: selection,
        text,
        forceMoveMarkers: true,
      }])
    },
    setValidationIssues(issues) {
      const editor = editorRef.current
      const monaco = monacoRef.current
      const model = editor?.getModel()
      if (!editor || !monaco || !model) {
        return
      }

      monaco.editor.setModelMarkers(
        model,
        'email-template-validator',
        issues.map((issue) => ({
          startLineNumber: issue.line,
          startColumn: issue.column,
          endLineNumber: issue.endLine ?? issue.line,
          endColumn: issue.endColumn ?? issue.column + 1,
          message: issue.message,
          severity: monaco.MarkerSeverity.Error,
        })),
      )
    },
  }), [])

  useEffect(() => {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) {
      return
    }

    const editorId = `template-${language}`
    const previousEditorId = currentEditorIdRef.current
    const model = getOrCreateModel(monaco, editorId, language, value)

    if (editor.getModel() !== model) {
      const previousViewState = editor.saveViewState()
      if (previousViewState) {
        viewStateCache.set(previousEditorId, previousViewState)
      }

      editor.setModel(model)

      const savedViewState = viewStateCache.get(editorId)
      if (savedViewState) {
        editor.restoreViewState(savedViewState)
      }

      currentEditorIdRef.current = editorId
    }

    if (model.getValue() !== value) {
      model.pushEditOperations(
        [],
        [{ range: model.getFullModelRange(), text: value }],
        () => null,
      )
    }

    requestAnimationFrame(() => {
      editor.layout()
    })
  }, [language, value])

  useEffect(() => {
    return () => {
      changeSubscriptionRef.current?.dispose()
    }
  }, [])

  const options = useMemo<MonacoEditor.IStandaloneEditorConstructionOptions>(() => ({
    fontSize: 13,
    fontFamily: 'Consolas, "SFMono-Regular", Menlo, Monaco, monospace',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'off',
    tabSize: 2,
    quickSuggestions: {
      other: true,
      strings: true,
      comments: false,
    },
    suggestOnTriggerCharacters: true,
    snippetSuggestions: 'top',
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    autoIndent: 'advanced',
    formatOnPaste: true,
    formatOnType: true,
    padding: {
      top: 14,
      bottom: 18,
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
  }), [])

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[0.95rem] bg-[#fbfaf7]"
      style={height === '100%' ? undefined : { height }}
    >
      <div className="flex items-center justify-between border-b border-[#efe8dc] bg-[#fcfaf5] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        <span>{language === 'php' ? 'PHP' : 'HTML / Twig'}</span>
        <span>{variables.length} variáveis</span>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          className="h-full"
          height={`${editorHeight}px`}
          defaultLanguage={getResolvedLanguage()}
          defaultValue={value}
          beforeMount={(monaco) => {
            ensureCompletionProvider(monaco, variablesRef)
            monaco.languages.html.htmlDefaults.setOptions({
              format: {
                tabSize: 2,
                insertSpaces: true,
                wrapLineLength: 120,
              },
              suggest: {
                html5: true,
              },
            })
          }}
          onMount={(editor, monaco) => {
            monacoRef.current = monaco
            editorRef.current = editor

            const editorId = `template-${language}`
            const model = getOrCreateModel(monaco, editorId, language, externalValueRef.current)
            editor.setModel(model)

            const savedViewState = viewStateCache.get(editorId)
            if (savedViewState) {
              editor.restoreViewState(savedViewState)
            }

            changeSubscriptionRef.current?.dispose()
            changeSubscriptionRef.current = editor.onDidChangeModelContent(() => {
              const nextValue = editor.getValue()
              if (nextValue !== externalValueRef.current) {
                externalValueRef.current = nextValue
                onChangeRef.current(nextValue)
              }
            })

            currentEditorIdRef.current = editorId

            requestAnimationFrame(() => {
              editor.layout()
            })
          }}
          options={options}
          path={`email-template-editor-${language}.html`}
        />
      </div>
    </div>
  )
})
