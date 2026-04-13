import { fireEvent, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CrudFormSections } from '@/src/components/crud-base/crud-form-sections'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { BANNERS_CONFIG } from '@/src/features/banners/services/banners-config'
import { renderWithProviders } from '@/src/test/render'

vi.mock('@/src/components/ui/image-upload-field', () => ({
  ImageUploadField: () => <div data-testid="image-upload-field" />,
}))

vi.mock('@/src/components/ui/icon-picker-field', () => ({
  IconPickerField: () => <div data-testid="icon-picker-field" />,
}))

vi.mock('@/src/components/ui/rich-text-editor', () => ({
  RichTextEditor: () => <div data-testid="rich-text-editor" />,
}))

vi.mock('@/src/components/ui/lookup-select', () => ({
  LookupSelect: ({ label }: { label: string }) => <div data-testid={`lookup-${label}`}>{label}</div>,
}))

vi.mock('@/src/contexts/auth-context', () => ({
  useAuth: () => ({ session: { currentTenant: { assetsBucketUrl: '' } } }),
}))

function BannerFormHarness() {
  const [form, setForm] = useState<CrudRecord>({
    ativo: true,
    permissao: 'todos',
    perfil: 'todos',
    canal: 'todos',
    target: '_self',
    tipo_link: '',
  })

  return (
    <CrudFormSections
      config={BANNERS_CONFIG}
      form={form}
      readOnly={false}
      patch={(key, value) => setForm((current) => ({ ...current, [key]: value }))}
      optionsMap={{}}
    />
  )
}

describe('BANNERS_CONFIG form behavior', () => {
  it('shows the correct lookup field when link type changes', () => {
    const { container } = renderWithProviders(<BannerFormHarness />)

    expect(screen.queryByTestId('lookup-Produto')).not.toBeInTheDocument()

    const linkTypeSelect = Array.from(container.querySelectorAll('select')).find((element) =>
      Array.from(element.options).some((option) => option.value === 'produto'),
    )

    expect(linkTypeSelect).toBeTruthy()
    fireEvent.change(linkTypeSelect!, { target: { value: 'produto' } })

    expect(screen.getByTestId('lookup-Produto')).toBeInTheDocument()
    expect(screen.queryByTestId('lookup-Marca')).not.toBeInTheDocument()
  })
})
