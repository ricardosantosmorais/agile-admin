'use client'

import { Eye, FileText, History, Loader2, RefreshCw, WandSparkles } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import {
  EmailTemplateEditorTab,
  type EmailTemplateEditorToolbarApi,
} from '@/src/features/emails-templates/components/email-template-editor-tab'
import { emailsTemplatesClient } from '@/src/features/emails-templates/services/emails-templates-client'
import { EMAILS_TEMPLATES_CONFIG } from '@/src/features/emails-templates/services/emails-templates-config'
import {
  convertPhpToTwig,
  convertTwigToPhp,
} from '@/src/features/emails-templates/services/emails-templates-template-converter'
import { useI18n } from '@/src/i18n/use-i18n'

function ToolbarActionButton({
  label,
  onClick,
  disabled = false,
  prominent = false,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  prominent?: boolean
  children: ReactNode
}) {
  return (
    <TooltipIconButton label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={[
          'inline-flex h-10 items-center justify-center gap-2 rounded-full px-3 transition disabled:cursor-not-allowed disabled:opacity-50',
          prominent
            ? 'bg-slate-950 text-white hover:bg-slate-800'
            : 'border border-[#e6dfd3] bg-white text-slate-700 hover:border-[#cdbfa8] hover:bg-[#fcfaf5] hover:text-slate-950',
        ].join(' ')}
      >
        {children}
        <span className="hidden text-sm font-semibold lg:inline">{label}</span>
      </button>
    </TooltipIconButton>
  )
}

export function EmailsTemplatesFormPage({ id }: { id?: string }) {
  const { t } = useI18n()
  const [editorApi, setEditorApi] = useState<EmailTemplateEditorToolbarApi | null>(null)

  return (
    <TabbedCatalogFormPage
      config={EMAILS_TEMPLATES_CONFIG}
      client={emailsTemplatesClient}
      id={id}
      tabs={[
        {
          key: 'general',
          label: t('maintenance.emailTemplates.tabs.general', 'Dados gerais'),
          icon: <FileText className="h-4 w-4" />,
          sectionIds: ['main', 'recipients'],
        },
        {
          key: 'editor',
          label: t('maintenance.emailTemplates.sections.editor', 'Editor'),
          icon: <WandSparkles className="h-4 w-4" />,
          renderToolbar: ({ form, patch }) => {
            const currentModel = editorApi?.model === 'php' ? 'php' : 'twig'
            const html = String(form.html || '')

            function handleModelChange(nextModel: 'php' | 'twig') {
              if (currentModel === nextModel) {
                return
              }

              const convertedHtml = nextModel === 'twig'
                ? convertPhpToTwig(html)
                : convertTwigToPhp(html)

              patch('modelo', nextModel)
              patch('html', convertedHtml)
            }

            return (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center overflow-hidden rounded-2xl border border-[#e7e0d1] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => handleModelChange('twig')}
                    className={[
                      'rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition',
                      currentModel === 'twig' ? 'bg-accent text-white' : 'text-slate-500 hover:text-slate-950',
                    ].join(' ')}
                    aria-label={t('maintenance.emailTemplates.editor.modelTwig', 'Twig')}
                  >
                    {t('maintenance.emailTemplates.editor.modelTwig', 'Twig')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModelChange('php')}
                    className={[
                      'rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition',
                      currentModel === 'php' ? 'bg-accent text-white' : 'text-slate-500 hover:text-slate-950',
                    ].join(' ')}
                    aria-label={t('maintenance.emailTemplates.editor.modelPhp', 'PHP')}
                  >
                    {t('maintenance.emailTemplates.editor.modelPhp', 'PHP')}
                  </button>
                </div>

                <ToolbarActionButton
                  label={t('maintenance.emailTemplates.editor.refreshVariables', 'Atualizar variáveis')}
                  onClick={() => {
                    void editorApi?.refreshVariables()
                  }}
                  disabled={!editorApi || editorApi.payloadLoading}
                >
                  {editorApi?.payloadLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </ToolbarActionButton>

                <ToolbarActionButton
                  label={t('maintenance.emailTemplates.editor.history', 'Histórico do template')}
                  onClick={() => {
                    void editorApi?.openHistory()
                  }}
                  disabled={!editorApi?.hasTemplateId}
                >
                  <History className="h-4 w-4" />
                </ToolbarActionButton>

                <ToolbarActionButton
                  label={t('maintenance.emailTemplates.editor.validate', 'Validar código')}
                  onClick={() => editorApi?.validateTemplate()}
                  disabled={!editorApi || editorApi.validationRunning}
                >
                  {editorApi?.validationRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                </ToolbarActionButton>

                <ToolbarActionButton
                  label={t('maintenance.emailTemplates.editor.preview', 'Pré-visualizar')}
                  onClick={() => {
                    void editorApi?.openPreview()
                  }}
                  disabled={!editorApi || editorApi.previewLoading}
                  prominent
                >
                  {editorApi?.previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                </ToolbarActionButton>
              </div>
            )
          },
          render: ({ form, readOnly, patch, onFeedback }) => (
            <EmailTemplateEditorTab
              form={form}
              readOnly={readOnly}
              patch={patch}
              onFeedback={onFeedback}
              onToolbarApiChange={setEditorApi}
            />
          ),
        },
      ]}
    />
  )
}
