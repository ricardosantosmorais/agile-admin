import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import type React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EmailTemplateEditorTab } from '@/src/features/emails-templates/components/email-template-editor-tab'
import { renderWithProviders } from '@/src/test/render'

const previewMock = vi.fn()
const getPayloadExampleMock = vi.fn()
const getHistoryMock = vi.fn()

vi.mock('@/src/features/emails-templates/services/emails-templates-editor-client', () => ({
  emailsTemplatesEditorClient: {
    preview: (...args: unknown[]) => previewMock(...args),
    getPayloadExample: (...args: unknown[]) => getPayloadExampleMock(...args),
    getHistory: (...args: unknown[]) => getHistoryMock(...args),
  },
}))

vi.mock('@/src/features/emails-templates/components/email-template-monaco', () => ({
  EmailTemplateMonaco: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      aria-label="Editor do template"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

vi.mock('@/src/components/ui/resizable-horizontal-panels', () => ({
  ResizableHorizontalPanels: ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) => (
    <div>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  ),
}))

describe('EmailTemplateEditorTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPayloadExampleMock.mockResolvedValue({
      payload: {
        cliente: {
          nome: 'ACME',
        },
      },
    })
    previewMock.mockResolvedValue('<html><body><p>Preview</p></body></html>')
    getHistoryMock.mockResolvedValue([])
  })

  it('loads variables and opens the preview modal from the toolbar api', async () => {
    const patch = vi.fn()
    const onFeedback = vi.fn()
    let toolbarApi: Parameters<NonNullable<React.ComponentProps<typeof EmailTemplateEditorTab>['onToolbarApiChange']>>[0] | null = null

    renderWithProviders(
      <EmailTemplateEditorTab
        form={{
          id: '9',
          tipo: 'pedido_aprovado',
          modelo: 'twig',
          html: '<p>{{ payload.cliente.nome }}</p>',
        }}
        readOnly={false}
        patch={patch}
        onFeedback={onFeedback}
        onToolbarApiChange={(api) => {
          toolbarApi = api
        }}
      />,
    )

    await waitFor(() => {
      expect(getPayloadExampleMock).toHaveBeenCalledWith('pedido_aprovado')
    })

    expect(screen.getByRole('heading', { name: /variáveis disponíveis|available variables/i })).toBeInTheDocument()

    await act(async () => {
      await toolbarApi?.openPreview()
    })

    await waitFor(() => {
      expect(previewMock).toHaveBeenCalled()
    })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTitle(/pr[ée]-visualiza[cç][aã]o do template|template preview|email preview/i)).toBeInTheDocument()

    fireEvent.change(screen.getAllByLabelText(/editor do template/i)[0], {
      target: { value: '<p>Alterado</p>' },
    })

    expect(patch).toHaveBeenCalledWith('html', '<p>Alterado</p>')
    expect(onFeedback).not.toHaveBeenCalledWith(expect.stringMatching(/erro|error/i))
  })
})
