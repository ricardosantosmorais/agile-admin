import { fireEvent } from '@testing-library/react'
import { screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { CrudFormSections } from '@/src/components/crud-base/crud-form-sections'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { CUPONS_DESCONTO_CONFIG } from '@/src/features/cupons-desconto/services/cupons-desconto-config'
import { renderWithProviders } from '@/src/test/render'

function CupomDescontoFormHarness({ initialForm }: { initialForm?: CrudRecord }) {
  const [form, setForm] = useState<CrudRecord>({
    ativo: true,
    primeiro_pedido: false,
    uso_unico: false,
    app: false,
    prazo_medio: false,
    aplica_automatico: false,
    tipo: '',
    perfil: 'todos',
    uso_promocao: '0',
    usos: '0',
    ...initialForm,
  })

  return (
    <CrudFormSections
      config={CUPONS_DESCONTO_CONFIG}
      form={form}
      readOnly={false}
      patch={(key, value) => setForm((current) => ({ ...current, [key]: value }))}
      optionsMap={{
        id_forma_pagamento: [{ value: '1', label: 'Pix - 1' }],
        id_condicao_pagamento: [{ value: '2', label: 'À vista - 2' }],
      }}
    />
  )
}

describe('CUPONS_DESCONTO_CONFIG form behavior', () => {
  it('shows value field only for the selected coupon type', () => {
    const { container } = renderWithProviders(<CupomDescontoFormHarness />)

    expect(screen.queryByText(/percentual de desconto aplicado ao pedido/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/valor fixo de desconto aplicado ao pedido/i)).not.toBeInTheDocument()

    const typeSelect = Array.from(container.querySelectorAll('select')).find((element) =>
      Array.from(element.options).some((option) => option.value === 'percentual'),
    )

    expect(typeSelect).toBeTruthy()
    fireEvent.change(typeSelect!, { target: { value: 'percentual' } })

    expect(screen.getByText(/percentual de desconto aplicado ao pedido/i)).toBeInTheDocument()

    fireEvent.change(typeSelect!, { target: { value: 'valor_fixo' } })

    expect(screen.queryByText(/percentual de desconto aplicado ao pedido/i)).not.toBeInTheDocument()
    expect(screen.getByText(/valor fixo de desconto aplicado ao pedido/i)).toBeInTheDocument()
  })

  it('disables locked fields when the coupon already has uses', () => {
    const { container } = renderWithProviders(<CupomDescontoFormHarness initialForm={{ tipo: 'percentual', usos: '3' }} />)

    const codeInput = Array.from(container.querySelectorAll('input')).find((input) => input.type === 'text')
    expect(codeInput).toBeTruthy()
    expect(codeInput).toBeDisabled()

    const typeSelect = Array.from(container.querySelectorAll('select')).find((element) =>
      Array.from(element.options).some((option) => option.value === 'frete_gratis'),
    )
    expect(typeSelect).toBeTruthy()
    expect(typeSelect).toBeDisabled()
  })

  it('hides payment condition when average payment term is filled', () => {
    renderWithProviders(<CupomDescontoFormHarness initialForm={{ prazo_medio_pagamento: '30' }} />)

    expect(screen.queryAllByText(/prazo médio máximo aceito para a condição de pagamento/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/se informada, restringe o cupom a esta condição de pagamento/i)).not.toBeInTheDocument()
  })
})
