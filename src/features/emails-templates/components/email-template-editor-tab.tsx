'use client'

import { History, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { ResizableHorizontalPanels } from '@/src/components/ui/resizable-horizontal-panels'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { EmailTemplateMonaco, type EmailTemplateMonacoHandle } from '@/src/features/emails-templates/components/email-template-monaco'
import { EmailTemplateVariableTree, collectVariablePaths } from '@/src/features/emails-templates/components/email-template-variable-tree'
import { emailsTemplatesClient } from '@/src/features/emails-templates/services/emails-templates-client'
import { emailsTemplatesEditorClient } from '@/src/features/emails-templates/services/emails-templates-editor-client'
import { normalizeEmailTemplateRecord } from '@/src/features/emails-templates/services/emails-templates-normalizer'
import {
  buildVariableToken,
  convertPhpToTwig,
  inferTemplateModel,
  renderTwigPreviewFallback,
} from '@/src/features/emails-templates/services/emails-templates-template-converter'
import { validateEmailTemplateMarkup } from '@/src/features/emails-templates/services/emails-templates-validator'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'

type TemplateModel = 'twig' | 'php'

type HistoryRow = {
  id: string
  data?: string | null
  html?: string | null
  usuario?: {
    nome?: string | null
  } | null
}

export type EmailTemplateEditorToolbarApi = {
  model: TemplateModel
  payloadLoading: boolean
  previewLoading: boolean
  hasTemplateId: boolean
  refreshVariables: () => Promise<void>
  validationRunning: boolean
  openHistory: () => Promise<void>
  openPreview: () => Promise<void>
  validateTemplate: () => void
}

type EmailTemplateEditorTabProps = {
  form: CrudRecord
  readOnly: boolean
  patch: (key: string, value: unknown) => void
  onFeedback: (message: string | null) => void
  onToolbarApiChange?: (api: EmailTemplateEditorToolbarApi | null) => void
}

function normalizeModel(value: unknown): TemplateModel {
  return String(value || '').toLowerCase() === 'php' ? 'php' : 'twig'
}

function WorkspaceLoadingState({ message }: { message: string }) {
  return (
    <div className="app-control-muted flex h-full min-h-0 flex-col rounded-[1rem] border-dashed px-4 py-4">
      <div className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--app-text)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {message}
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-11 animate-pulse rounded-[0.95rem] bg-[color:var(--app-control-border)] opacity-40" />
        <div className="h-11 animate-pulse rounded-[0.95rem] bg-[color:var(--app-control-border)] opacity-25" />
        <div className="h-11 animate-pulse rounded-[0.95rem] bg-[color:var(--app-control-border)] opacity-40" />
      </div>
    </div>
  )
}

function VariablesPanel({
  payloadLoading,
  variablePaths,
  payload,
  model,
  readOnly,
  onInsertToken,
}: {
  payloadLoading: boolean
  variablePaths: string[]
  payload: unknown
  model: TemplateModel
  readOnly: boolean
  onInsertToken: (token: string) => void
}) {
  const { t } = useI18n()

  return (
    <div className="app-control flex h-full min-h-0 flex-col overflow-hidden rounded-[1rem]">
      <div className="border-b border-[color:var(--app-card-border)] bg-[color:var(--app-control-muted-bg)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-text)]">
              {t('maintenance.emailTemplates.editor.availableVariables', 'Available variables')}
            </h4>
            <p className="mt-1 text-xs leading-5 text-[color:var(--app-muted)]">
              {t('maintenance.emailTemplates.editor.insertHint', 'Click or drag a variable to insert it at cursor position.')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone={payloadLoading ? 'warning' : 'neutral'}>
              {payloadLoading ? t('common.loading', 'Loading...') : `${variablePaths.length}`}
            </StatusBadge>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-[color:var(--app-control-muted-bg)]">
        {payloadLoading ? (
          <WorkspaceLoadingState message={t('maintenance.emailTemplates.editor.loadingVariables', 'Carregando variáveis disponíveis...')} />
        ) : (
          <div className="email-template-variable-scroll h-full overflow-auto px-2 pb-2 pt-2">
            <EmailTemplateVariableTree
              payload={payload}
              buildToken={(path) => buildVariableToken(path, model)}
              onInsertToken={onInsertToken}
              disabled={readOnly}
              rootLabel={t('maintenance.emailTemplates.editor.payloadRoot', 'payload')}
              emptyMessage={t('maintenance.emailTemplates.editor.emptyVariables', 'No variables available for selected template type.')}
              initialExpandDepth={1}
              className="h-full max-h-none pr-3"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function EmailTemplateEditorTab({
  form,
  readOnly,
  patch,
  onFeedback,
  onToolbarApiChange,
}: EmailTemplateEditorTabProps) {
  const { t } = useI18n()
  const editorRef = useRef<EmailTemplateMonacoHandle | null>(null)
  const [leftPanelPercentage, setLeftPanelPercentage] = useState(31)
  const [payload, setPayload] = useState<unknown>(null)
  const [payloadLoading, setPayloadLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([])
  const [historyError, setHistoryError] = useState('')
  const [validationRunning, setValidationRunning] = useState(false)
  const htmlRecoveryAttemptedRef = useRef(false)

  const model = normalizeModel(form.modelo)
  const html = String(form.html || '')
  const type = String(form.tipo || '').trim()
  const templateId = String(form.id || '').trim()
  const isPhpModel = model === 'php'
  const variablePaths = useMemo(() => collectVariablePaths(payload), [payload])
  const historyColumns = useMemo<AppDataTableColumn<HistoryRow>[]>(() => [
    {
      id: 'id',
      label: 'ID',
      cell: (row) => (
        <span className="app-control-muted inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-[color:var(--app-muted)]">
          #{row.id}
        </span>
      ),
      thClassName: 'w-[120px]',
    },
    {
      id: 'usuario',
      label: t('maintenance.emailTemplates.editor.historyUser', 'User'),
      cell: (row) => row.usuario?.nome || '-',
      tdClassName: 'text-[color:var(--app-text)]',
    },
    {
      id: 'data',
      label: t('maintenance.emailTemplates.editor.historyDate', 'Date'),
      cell: (row) => row.data ? formatDateTime(row.data) : '-',
      thClassName: 'w-[220px]',
      tdClassName: 'text-[color:var(--app-text)]',
    },
  ], [t])

  useEffect(() => {
    if (form.modelo == null || String(form.modelo).trim() === '') {
      patch('modelo', 'twig')
    }
  }, [form.modelo, patch])

  useEffect(() => {
    if (!templateId || html.trim() || htmlRecoveryAttemptedRef.current) {
      return
    }

    htmlRecoveryAttemptedRef.current = true

    void emailsTemplatesClient.getById(templateId).then((record) => {
      const normalized = normalizeEmailTemplateRecord(record)
      const recoveredHtml = String(normalized.html || '')

      if (!recoveredHtml.trim()) {
        return
      }

      patch('html', recoveredHtml)

      if (!String(form.modelo || '').trim() && String(normalized.modelo || '').trim()) {
        patch('modelo', normalized.modelo)
      }
    }).catch(() => {
      htmlRecoveryAttemptedRef.current = false
    })
  }, [form.modelo, html, patch, templateId])

  const loadPayload = useCallback(async () => {
    if (!type) {
      setPayload(null)
      return
    }

    setPayloadLoading(true)
    try {
      const response = await emailsTemplatesEditorClient.getPayloadExample(type)
      setPayload(response)
    } catch (error) {
      setPayload(null)
      onFeedback(error instanceof Error ? error.message : t('maintenance.emailTemplates.editor.payloadLoadError', 'Could not load variables for selected template type.'))
    } finally {
      setPayloadLoading(false)
    }
  }, [onFeedback, t, type])

  useEffect(() => {
    void loadPayload()
  }, [loadPayload])

  const validateTemplate = useCallback(() => {
    setValidationRunning(true)
    const issues = validateEmailTemplateMarkup(html)
    editorRef.current?.setValidationIssues(issues)

    if (issues.length) {
      onFeedback(
        t('maintenance.emailTemplates.editor.validationError', 'Validação encontrou {{count}} problema(s) no template.', {
          count: String(issues.length),
        }),
      )
    } else {
      onFeedback(t('maintenance.emailTemplates.editor.validationSuccess', 'Nenhum problema estrutural encontrado no template.'))
    }

    setValidationRunning(false)
  }, [html, onFeedback, t])

  const openPreview = useCallback(async () => {
    setPreviewOpen(true)
    setPreviewLoading(true)

    const templateForPreview = model === 'php' ? convertPhpToTwig(html) : html
    const payloadForPreview = payload ?? {}

    try {
      if (!templateForPreview.trim()) {
        setPreviewHtml(renderTwigPreviewFallback(templateForPreview, payloadForPreview))
        onFeedback(t('maintenance.emailTemplates.editor.previewEmptyTemplate', 'Informe o template para gerar a pre-visualizacao.'))
        return
      }

      const rendered = await emailsTemplatesEditorClient.preview({
        template: templateForPreview,
        payload: payloadForPreview,
      })

      setPreviewHtml(rendered)
    } catch (error) {
      const fallback = renderTwigPreviewFallback(templateForPreview, payloadForPreview)
      setPreviewHtml(fallback)
      onFeedback(error instanceof Error ? error.message : t('maintenance.emailTemplates.editor.previewFallbackNotice', 'Preview rendered in simplified mode due to endpoint failure.'))
    } finally {
      setPreviewLoading(false)
    }
  }, [html, model, onFeedback, payload, t])

  const openHistory = useCallback(async () => {
    if (!templateId) {
      return
    }

    setHistoryOpen(true)
    setHistoryLoading(true)
    setHistoryError('')

    try {
      const rows = await emailsTemplatesEditorClient.getHistory(templateId)
      setHistoryRows(rows)
    } catch (error) {
      setHistoryRows([])
      const message = error instanceof Error ? error.message : t('maintenance.emailTemplates.editor.historyLoadError', 'Could not load template history.')
      setHistoryError(message)
      onFeedback(message)
    } finally {
      setHistoryLoading(false)
    }
  }, [onFeedback, t, templateId])

  useEffect(() => {
    if (!onToolbarApiChange) {
      return
    }

    onToolbarApiChange({
      model,
      payloadLoading,
      previewLoading,
      hasTemplateId: Boolean(templateId),
      refreshVariables: loadPayload,
      validationRunning,
      openHistory,
      openPreview,
      validateTemplate,
    })

    return () => {
      onToolbarApiChange(null)
    }
  }, [
    loadPayload,
    model,
    onToolbarApiChange,
    openHistory,
    openPreview,
    payloadLoading,
    previewLoading,
    templateId,
    validateTemplate,
    validationRunning,
  ])

  return (
    <SectionCard className="overflow-hidden px-0 py-0">
      <style jsx>{`
        :global(.email-template-variable-scroll) {
          scrollbar-width: thin;
          scrollbar-color: #d7cfbf transparent;
        }

        :global(.email-template-variable-scroll::-webkit-scrollbar) {
          width: 7px;
        }

        :global(.email-template-variable-scroll::-webkit-scrollbar-track) {
          background: transparent;
        }

        :global(.email-template-variable-scroll::-webkit-scrollbar-thumb) {
          background: #d7cfbf;
          border-radius: 999px;
        }
      `}</style>

      <div className="px-1 py-1 sm:px-1.5 sm:py-1.5">
        <div className="lg:hidden">
          <div className="app-control flex min-h-[620px] flex-col overflow-hidden rounded-[1rem]">
            <EmailTemplateMonaco
              ref={editorRef}
              value={html}
              language={isPhpModel ? 'php' : 'html'}
              variables={variablePaths}
              onChange={(value) => patch('html', value)}
              height="100%"
            />
          </div>
        </div>

        <div className="hidden lg:block">
          <ResizableHorizontalPanels
            leftPercentage={leftPanelPercentage}
            onLeftPercentageChange={setLeftPanelPercentage}
            minLeftPx={280}
            minRightPx={420}
            minHeightClassName="min-h-[620px]"
            left={(
              <VariablesPanel
                payloadLoading={payloadLoading}
                variablePaths={variablePaths}
                payload={payload}
                model={model}
                readOnly={readOnly}
                onInsertToken={(token) => editorRef.current?.insertTextAtCursor(token)}
              />
            )}
            right={(
              <div className="app-control flex h-full min-h-0 flex-col overflow-hidden rounded-[1rem]">
                <div className="flex min-h-0 flex-1 overflow-hidden p-0">
                  <EmailTemplateMonaco
                    ref={editorRef}
                    value={html}
                    language={isPhpModel ? 'php' : 'html'}
                    variables={variablePaths}
                    onChange={(value) => patch('html', value)}
                    height="100%"
                  />
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <OverlayModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={t('maintenance.emailTemplates.editor.historyTitle', 'Template history')}
        maxWidthClassName="max-w-5xl"
        bodyScrollable={false}
        headerActions={historyRows.length ? <StatusBadge tone="info">{historyRows.length}</StatusBadge> : null}
      >
        <AsyncState isLoading={historyLoading} error={historyError}>
          <SectionCard className="overflow-hidden px-0 py-0">
            <div className="border-b border-[color:var(--app-card-border)] bg-[color:var(--app-control-muted-bg)] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[color:var(--app-muted)]">
                  {t('maintenance.emailTemplates.editor.history', 'Template history')}
                </p>
                <StatusBadge tone="neutral">
                  <span className="inline-flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    {historyRows.length}
                  </span>
                </StatusBadge>
              </div>
            </div>
            <div className="p-4">
              <AppDataTable
                rows={historyRows}
                getRowId={(row) => row.id}
                columns={historyColumns}
                emptyMessage={t('maintenance.emailTemplates.editor.emptyHistory', 'No history available for this template.')}
                mobileCard={{
                  title: (row) => `#${row.id}`,
                  subtitle: (row) => row.usuario?.nome || '-',
                  meta: (row) => row.data ? formatDateTime(row.data) : '-',
                }}
                actionsLabel={t('common.actions', 'Actions')}
                rowActions={(row) => [
                  {
                    id: 'load-version',
                    label: t('maintenance.emailTemplates.editor.loadVersion', 'Load version'),
                    icon: History,
                    onClick: () => {
                      const nextHtml = String(row.html || '')
                      patch('modelo', inferTemplateModel(nextHtml))
                      patch('html', nextHtml)
                      setHistoryOpen(false)
                    },
                  },
                ]}
              />
            </div>
          </SectionCard>
        </AsyncState>
      </OverlayModal>

      <OverlayModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={t('maintenance.emailTemplates.editor.previewTitle', 'Email preview')}
        maxWidthClassName="max-w-[95vw]"
      >
        <AsyncState
          isLoading={previewLoading}
          loadingTitle={t('maintenance.emailTemplates.editor.previewLoadingTitle', 'Carregando pré-visualização')}
          loadingDescription={t('maintenance.emailTemplates.editor.previewLoading', 'Renderizando template...')}
        >
          <div className="app-control-muted overflow-hidden rounded-[1.2rem] p-2">
            <iframe
              title={t('maintenance.emailTemplates.editor.previewFrameTitle', 'Template preview')}
              srcDoc={previewHtml}
              className="h-[70vh] w-full rounded-[0.95rem] border border-[#e6dfd3] bg-white"
            />
          </div>
        </AsyncState>
      </OverlayModal>
    </SectionCard>
  )
}
