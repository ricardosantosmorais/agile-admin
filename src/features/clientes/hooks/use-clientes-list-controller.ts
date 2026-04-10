'use client'

import { useEffect, useMemo, useState } from 'react'
import { readSessionState, writeSessionState } from '@/src/components/data-table/table-persistence'
import { useDataTableState } from '@/src/components/data-table/use-data-table-state'
import {
  CLIENTES_LIST_STORAGE_KEY,
  DEFAULT_CLIENT_LIST_FILTERS,
  type ClientListConfirmState,
  type ClientListLoadState,
  type ClientesModalState,
  type PersistedClientListState,
} from '@/src/features/clientes/services/clientes-list'
import type { ClientLinkedSellerListItem, ClientLinkedUser, ClientListFilters, ClientListItem } from '@/src/features/clientes/types/clientes'
import { appData } from '@/src/services/app-data'

type UseClientesListControllerParams = {
  canDelete: boolean
}

export function useClientesListController({ canDelete }: UseClientesListControllerParams) {
  const persistedState = useMemo(() => {
    const parsed = readSessionState<Partial<PersistedClientListState>>(CLIENTES_LIST_STORAGE_KEY)
    if (!parsed?.filters || !parsed?.filtersDraft) {
      return null
    }

    return {
      filters: { ...DEFAULT_CLIENT_LIST_FILTERS, ...parsed.filters },
      filtersDraft: { ...DEFAULT_CLIENT_LIST_FILTERS, ...parsed.filtersDraft },
      filtersExpanded: parsed.filtersExpanded === true,
    } satisfies PersistedClientListState
  }, [])

  const [filtersDraft, setFiltersDraft] = useState<ClientListFilters>(persistedState?.filtersDraft ?? DEFAULT_CLIENT_LIST_FILTERS)
  const [filters, setFilters] = useState<ClientListFilters>(persistedState?.filters ?? DEFAULT_CLIENT_LIST_FILTERS)
  const [filtersExpanded, setFiltersExpanded] = useState(persistedState?.filtersExpanded ?? false)
  const [state, setState] = useState<ClientListLoadState>({ isLoading: true, error: null })
  const [response, setResponse] = useState<Awaited<ReturnType<typeof appData.clients.list>> | null>(null)
  const [modal, setModal] = useState<ClientesModalState>({ type: 'none' })
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [linkedUsers, setLinkedUsers] = useState<ClientLinkedUser[]>([])
  const [linkedSellers, setLinkedSellers] = useState<ClientLinkedSellerListItem[]>([])
  const [unlockDescription, setUnlockDescription] = useState('')
  const [confirmState, setConfirmState] = useState<ClientListConfirmState>(null)

  const clients = response?.data ?? []
  const meta = response?.meta

  const tableState = useDataTableState<ClientListItem, ClientListFilters, ClientListFilters['orderBy']>({
    rows: clients,
    getRowId: (client) => client.id,
    filters,
    setFilters,
    setFiltersDraft,
  })
  const { clearSelection } = tableState

  const deleteSelectionVisible = canDelete && tableState.selectedIds.length > 0

  useEffect(() => {
    let alive = true

    async function load() {
      setState({ isLoading: true, error: null })
      try {
        const result = await appData.clients.list(filters)
        if (!alive) {
          return
        }

        setResponse(result)
        clearSelection()
        setState({ isLoading: false, error: null })
      } catch (error) {
        if (!alive) {
          return
        }

        setState({
          isLoading: false,
          error: error instanceof Error ? error : new Error('Não foi possível carregar os clientes.'),
        })
      }
    }

    void load()

    return () => {
      alive = false
    }
  }, [clearSelection, filters])

  useEffect(() => {
    writeSessionState(CLIENTES_LIST_STORAGE_KEY, {
      filters,
      filtersDraft,
      filtersExpanded,
    } satisfies PersistedClientListState)
  }, [filters, filtersDraft, filtersExpanded])

  function patchDraft<K extends keyof ClientListFilters>(key: K, value: ClientListFilters[K]) {
    setFiltersDraft((current) => ({ ...current, [key]: value }))
  }

  function applyFilters() {
    setFilters({
      ...filtersDraft,
      page: 1,
    })
  }

  function clearFilters() {
    setFiltersDraft(DEFAULT_CLIENT_LIST_FILTERS)
    setFilters(DEFAULT_CLIENT_LIST_FILTERS)
  }

  function setPerPage(perPage: number) {
    setFiltersDraft((current) => ({
      ...current,
      page: 1,
      perPage,
    }))
    setFilters((current) => ({
      ...current,
      page: 1,
      perPage,
    }))
  }

  function refreshList() {
    setFilters((current) => ({ ...current }))
  }

  async function openLinkedUsers(client: ClientListItem) {
    setModal({ type: 'linked-users', client })
    setModalLoading(true)
    setModalError('')
    setLinkedUsers([])

    try {
      setLinkedUsers(await appData.clients.getLinkedUsers(client.id))
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Não foi possível carregar os usuários vinculados.')
    } finally {
      setModalLoading(false)
    }
  }

  async function openLinkedSellers(client: ClientListItem) {
    setModal({ type: 'linked-sellers', client })
    setModalLoading(true)
    setModalError('')
    setLinkedSellers([])

    try {
      setLinkedSellers(await appData.clients.getLinkedSellers(client.id))
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Não foi possível carregar os vendedores vinculados.')
    } finally {
      setModalLoading(false)
    }
  }

  function openUnlock(client: ClientListItem, platform: boolean) {
    setUnlockDescription('')
    setModalError('')
    setModal({ type: 'unlock', client, platform })
  }

  function openView(client: ClientListItem) {
    setModalError('')
    setModal({ type: 'view', client })
  }

  async function handleRemoveLinkedUser(clientId: string, userId: string) {
    setModalError('')
    try {
      await appData.clients.unlinkUser(clientId, userId)
      setLinkedUsers((current) => current.filter((item) => item.idUsuario !== userId))
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Não foi possível remover o usuário vinculado.')
    }
  }

  async function handleDeleteClients(ids: string[]) {
    try {
      await appData.clients.delete(ids)
      clearSelection()
      refreshList()
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error : new Error('Não foi possível excluir o cliente.'),
      })
    }
  }

  async function handleUnlock() {
    if (modal.type !== 'unlock') {
      return
    }

    if (!unlockDescription.trim()) {
      setModalError('Informe a justificativa para desbloquear o cliente.')
      return
    }

    setModalLoading(true)
    setModalError('')

    try {
      await appData.clients.unlock(modal.client.id, unlockDescription, modal.platform)
      setModal({ type: 'none' })
      setUnlockDescription('')
      refreshList()
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Não foi possível desbloquear o cliente.')
    } finally {
      setModalLoading(false)
    }
  }

  async function handleConfirmAction() {
    if (!confirmState) {
      return
    }

    if (confirmState.kind === 'delete-users-link') {
      await handleRemoveLinkedUser(confirmState.clientId, confirmState.userId)
    }

    if (confirmState.kind === 'delete-client') {
      await handleDeleteClients(confirmState.ids)
    }

    setConfirmState(null)
  }

  function closeModal() {
    setModal({ type: 'none' })
    setModalLoading(false)
    setModalError('')
    setLinkedUsers([])
    setLinkedSellers([])
    setUnlockDescription('')
  }

  return {
    filters,
    filtersDraft,
    filtersExpanded,
    state,
    response,
    clients,
    meta,
    modal,
    modalLoading,
    modalError,
    linkedUsers,
    linkedSellers,
    unlockDescription,
    confirmState,
    deleteSelectionVisible,
    setFiltersExpanded,
    setUnlockDescription,
    setConfirmState,
    patchDraft,
    applyFilters,
    clearFilters,
    setPerPage,
    refreshList,
    openView,
    openLinkedUsers,
    openLinkedSellers,
    openUnlock,
    handleUnlock,
    handleConfirmAction,
    closeModal,
    tableState,
  }
}
