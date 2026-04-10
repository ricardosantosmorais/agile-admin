'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { dashboardPresets, type DashboardSnapshot } from '@/src/features/dashboard/types/dashboard'
import { appData } from '@/src/services/app-data'

export type DashboardPhaseId =
  | 'summary'
  | 'customers'
  | 'series'
  | 'funnel'
  | 'mix'
  | 'clients'
  | 'operations'
  | 'payments'
  | 'marketingMix'
  | 'marketingTops'

export type StoredDashboardRange = {
  label?: string
  start: string
  end: string
}

type DateRangeValue = {
  start: string
  end: string
}

type DashboardPhaseDefinition = {
  id: DashboardPhaseId
  blocks: string[]
}

const STORAGE_KEY = 'dashboard'

const phaseDefinitions: DashboardPhaseDefinition[] = [
  { id: 'summary', blocks: ['resumo'] },
  { id: 'customers', blocks: ['clientes_resumo'] },
  { id: 'series', blocks: ['serie', 'alertas'] },
  { id: 'funnel', blocks: ['funil'] },
  { id: 'mix', blocks: ['mix'] },
  { id: 'clients', blocks: ['clientes_listas', 'coorte'] },
  { id: 'operations', blocks: ['produtos', 'operacao'] },
  { id: 'payments', blocks: ['pagamentos', 'marketing_resumo'] },
  { id: 'marketingMix', blocks: ['marketing_mix'] },
  { id: 'marketingTops', blocks: ['marketing_tops'] },
]

const orderedPhaseIds = phaseDefinitions.map((phase) => phase.id)

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getDefaultPresetRanges(today: Date) {
  return dashboardPresets.map((preset) => {
    if (preset.id === 'mes_atual') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return {
        id: preset.id,
        label: preset.label,
        range: {
          start: formatDateInput(start),
          end: formatDateInput(end),
        },
      }
    }

    const end = new Date(today)
    const start = new Date(today)
    start.setDate(end.getDate() - (preset.days - 1))

    return {
      id: preset.id,
      label: preset.label,
      range: {
        start: formatDateInput(start),
        end: formatDateInput(end),
      },
    }
  })
}

function readStoredDashboardRange() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<StoredDashboardRange>
    if (!parsed.start || !parsed.end) {
      return null
    }

    return {
      label: parsed.label,
      start: parsed.start,
      end: parsed.end,
    } satisfies StoredDashboardRange
  } catch {
    return null
  }
}

function createEmptySnapshot(rangeLabel: string): DashboardSnapshot {
  return {
    rangeLabel,
    primaryMetrics: [],
    customerMetrics: [],
    serie: [],
    ticketByDay: [],
    channel: [],
    emitente: [],
    funil: [],
    monitoringAlerts: [],
    coorte: [],
    topClients: [],
    topProducts: [],
    payments: [],
    hourlyRevenue: [],
    marketingMetrics: [],
    marketingMixExclusive: [],
    marketingMixInclusive: [],
    marketingTicketComparison: [],
    topCoupons: [],
    topPromotions: [],
  }
}

function mergePhaseSnapshot(current: DashboardSnapshot, partial: DashboardSnapshot, phaseId: DashboardPhaseId) {
  switch (phaseId) {
    case 'summary':
      return { ...current, rangeLabel: partial.rangeLabel, primaryMetrics: partial.primaryMetrics }
    case 'customers':
      return { ...current, customerMetrics: partial.customerMetrics }
    case 'series':
      return {
        ...current,
        serie: partial.serie,
        ticketByDay: partial.ticketByDay,
        monitoringAlerts: partial.monitoringAlerts,
      }
    case 'funnel':
      return { ...current, funil: partial.funil }
    case 'mix':
      return { ...current, channel: partial.channel, emitente: partial.emitente }
    case 'clients':
      return { ...current, topClients: partial.topClients, coorte: partial.coorte }
    case 'operations':
      return { ...current, topProducts: partial.topProducts, hourlyRevenue: partial.hourlyRevenue }
    case 'payments':
      return {
        ...current,
        payments: partial.payments,
        marketingMetrics: partial.marketingMetrics,
        marketingTicketComparison: partial.marketingTicketComparison,
      }
    case 'marketingMix':
      return {
        ...current,
        marketingMixExclusive: partial.marketingMixExclusive,
        marketingMixInclusive: partial.marketingMixInclusive,
      }
    case 'marketingTops':
      return { ...current, topCoupons: partial.topCoupons, topPromotions: partial.topPromotions }
    default:
      return current
  }
}

function normalizeRequestedPhases(phaseIds: DashboardPhaseId[]) {
  const requested = new Set(phaseIds)
  return orderedPhaseIds.filter((phaseId) => requested.has(phaseId))
}

export function useDashboardSequencedSnapshot(tenantId: string) {
  const today = useMemo(() => new Date(), [])
  const presetRanges = useMemo(() => getDefaultPresetRanges(today), [today])
  const [selectedRange, setSelectedRange] = useState<DateRangeValue>(() => {
    const stored = readStoredDashboardRange()
    return stored ? { start: stored.start, end: stored.end } : presetRanges[0].range
  })
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [requestedPhases, setRequestedPhases] = useState<DashboardPhaseId[]>(['summary'])
  const [completedPhases, setCompletedPhases] = useState<DashboardPhaseId[]>([])
  const [failedPhases, setFailedPhases] = useState<DashboardPhaseId[]>([])
  const [error, setError] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const forceRefreshRef = useRef(false)
  const cycleForceRefreshRef = useRef(false)
  const phaseWaitersRef = useRef<
    Array<{
      phaseIds: DashboardPhaseId[]
      resolve: () => void
      reject: (error: Error) => void
    }>
  >([])

  const selectedRangeLabel = useMemo(() => {
    const preset = presetRanges.find(
      (item) => item.range.start === selectedRange.start && item.range.end === selectedRange.end,
    )
    if (preset) {
      return preset.label
    }

    return `${selectedRange.start} a ${selectedRange.end}`
  }, [presetRanges, selectedRange.end, selectedRange.start])

  const currentPhase = useMemo(
    () =>
      orderedPhaseIds.find(
        (phaseId) =>
          requestedPhases.includes(phaseId) &&
          !completedPhases.includes(phaseId) &&
          !failedPhases.includes(phaseId),
      ) ?? null,
    [completedPhases, failedPhases, requestedPhases],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        label: selectedRangeLabel,
        start: selectedRange.start,
        end: selectedRange.end,
      } satisfies StoredDashboardRange),
    )
  }, [selectedRange.end, selectedRange.start, selectedRangeLabel])

  useEffect(() => {
    const baseSnapshot = createEmptySnapshot(selectedRangeLabel)
    cycleForceRefreshRef.current = forceRefreshRef.current
    forceRefreshRef.current = false

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(baseSnapshot)
    setCompletedPhases([])
    setFailedPhases([])
    setError('')
  }, [refreshToken, selectedRange.end, selectedRange.start, selectedRangeLabel, tenantId])

  useEffect(() => {
    if (!currentPhase) {
      return
    }

    const phaseDefinition = phaseDefinitions.find((entry) => entry.id === currentPhase)
    if (!phaseDefinition) {
      return
    }

    const baseSnapshot = createEmptySnapshot(selectedRangeLabel)
    const phaseId = phaseDefinition.id
    const phaseBlocks = phaseDefinition.blocks
    let cancelled = false

    async function loadPhase() {
      try {
        const partial = await appData.dashboard.getSnapshotByBlocks(
          tenantId,
          selectedRange.start,
          selectedRange.end,
          selectedRangeLabel,
          phaseBlocks,
          { forceRefresh: cycleForceRefreshRef.current },
        )

        if (cancelled) {
          return
        }

        setSnapshot((current) => mergePhaseSnapshot(current ?? baseSnapshot, partial, phaseId))
        setCompletedPhases((current) => (current.includes(phaseId) ? current : [...current, phaseId]))
      } catch (phaseError) {
        if (cancelled) {
          return
        }

        const normalizedError = phaseError instanceof Error
          ? phaseError
          : new Error('Nao foi possivel carregar parte dos dados do dashboard.')

        setFailedPhases((current) => (current.includes(phaseId) ? current : [...current, phaseId]))
        setError(normalizedError.message)
      }
    }

    void loadPhase()

    return () => {
      cancelled = true
    }
  }, [currentPhase, selectedRange.end, selectedRange.start, selectedRangeLabel, tenantId])

  useEffect(() => {
    if (cycleForceRefreshRef.current && completedPhases.length > 0) {
      cycleForceRefreshRef.current = false
    }
  }, [completedPhases])

  useEffect(() => {
    if (!phaseWaitersRef.current.length) {
      return
    }

    const remainingWaiters: typeof phaseWaitersRef.current = []

    for (const waiter of phaseWaitersRef.current) {
      const failedPhase = waiter.phaseIds.find((phaseId) => failedPhases.includes(phaseId))
      if (failedPhase) {
        waiter.reject(new Error(`Falha ao carregar a fase ${failedPhase} do dashboard.`))
        continue
      }

      const isComplete = waiter.phaseIds.every((phaseId) => completedPhases.includes(phaseId))
      if (isComplete) {
        waiter.resolve()
        continue
      }

      remainingWaiters.push(waiter)
    }

    phaseWaitersRef.current = remainingWaiters
  }, [completedPhases, failedPhases])

  function requestPhases(phaseIds: DashboardPhaseId | DashboardPhaseId[]) {
    const nextIds = Array.isArray(phaseIds) ? phaseIds : [phaseIds]

    setRequestedPhases((current) => {
      const normalized = normalizeRequestedPhases([...current, ...nextIds])
      if (normalized.length === current.length && normalized.every((phaseId, index) => phaseId === current[index])) {
        return current
      }

      return normalized
    })
  }

  function ensurePhasesLoaded(phaseIds: DashboardPhaseId[]) {
    requestPhases(phaseIds)

    if (phaseIds.every((phaseId) => completedPhases.includes(phaseId))) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      phaseWaitersRef.current.push({ phaseIds, resolve, reject })
    })
  }

  return {
    allPhaseIds: orderedPhaseIds,
    presetRanges,
    selectedRange,
    selectedRangeLabel,
    setSelectedRange,
    snapshot,
    requestedPhases,
    completedPhases,
    failedPhases,
    currentPhase,
    error,
    requestPhases,
    ensurePhasesLoaded,
    refreshSnapshot: () => {
      forceRefreshRef.current = true
      setRefreshToken((current) => current + 1)
    },
  }
}
