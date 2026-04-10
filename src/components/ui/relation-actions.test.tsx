import { cleanup, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RelationActions } from '@/src/components/ui/relation-actions'
import { renderWithProviders } from '@/src/test/render'

afterEach(() => {
  cleanup()
})

describe('RelationActions', () => {
  it('keeps delete disabled until there is a selection', () => {
    const onDelete = vi.fn()

    renderWithProviders(<RelationActions hasSelection={false} onDelete={onDelete} onCreate={vi.fn()} />)

    const deleteButton = screen.getByRole('button', { name: /excluir|delete/i })

    expect(deleteButton).toBeDisabled()
    expect(deleteButton).toHaveAttribute('data-state', 'disabled')

    fireEvent.click(deleteButton)

    expect(onDelete).not.toHaveBeenCalled()
  })

  it('enables delete when a relation is selected', () => {
    const onDelete = vi.fn()

    renderWithProviders(<RelationActions hasSelection onDelete={onDelete} onCreate={vi.fn()} />)

    const deleteButton = screen.getByRole('button', { name: /excluir|delete/i })

    expect(deleteButton).toBeEnabled()
    expect(deleteButton).toHaveAttribute('data-state', 'enabled')

    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
