'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { dashboardPresets, type DashboardSnapshot } from '@/src/lib/fake-data'
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

export function useDashboardSequencedSnapshot(tenantId: string) {
  const today = useMemo(() => new Date(), [])
  const presetRanges = useMemo(() => getDefaultPresetRanges(today), [today])
  const [selectedRange, setSelectedRange] = useState<DateRangeValue>(() => {
    const stored = readStoredDashboardRange()
    return stored
      ? { start: stored.start, end: stored.end }
      : presetRanges[0].range
  })
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [completedPhases, setCompletedPhases] = useState<DashboardPhaseId[]>([])
  const [currentPhase, setCurrentPhase] = useState<DashboardPhaseId | null>(null)
  const [error, setError] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const forceRefreshRef = useRef(false)

  const selectedRangeLabel = useMemo(() => {
    const preset = presetRanges.find(
      (item) => item.range.start === selectedRange.start && item.range.end === selectedRange.end,
    )
    if (preset) {
      return preset.label
    }

    return `${selectedRange.start} a ${selectedRange.end}`
  }, [presetRanges, selectedRange.end, selectedRange.start])

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
    let cancelled = false
    const baseSnapshot = createEmptySnapshot(selectedRangeLabel)
    const shouldForceRefresh = forceRefreshRef.current
    forceRefreshRef.current = false

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(baseSnapshot)
    setCompletedPhases([])
    setCurrentPhase(phaseDefinitions[0]?.id ?? null)
    setError('')

    async function load() {
      let hasFailures = false

      for (const phase of phaseDefinitions) {
        if (cancelled) {
          return
        }

        setCurrentPhase(phase.id)

        try {
          const partial = await appData.dashboard.getSnapshotByBlocks(
            tenantId,
            selectedRange.start,
            selectedRange.end,
            selectedRangeLabel,
            phase.blocks,
            { forceRefresh: shouldForceRefresh },
          )

          if (cancelled) {
            return
          }

          setSnapshot((current) => mergePhaseSnapshot(current ?? baseSnapshot, partial, phase.id))
          setCompletedPhases((current) => [...current, phase.id])
        } catch (phaseError) {
          if (cancelled) {
            return
          }

          hasFailures = true
          setError(
            phaseError instanceof Error
              ? phaseError.message
              : 'Não foi possível carregar parte dos dados do dashboard.',
          )
        }
      }

      if (!cancelled) {
        setCurrentPhase(null)
        if (!hasFailures) {
          setError('')
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [refreshToken, selectedRange.end, selectedRange.start, selectedRangeLabel, tenantId])

  return {
    presetRanges,
    selectedRange,
    selectedRangeLabel,
    setSelectedRange,
    snapshot,
    completedPhases,
    currentPhase,
    error,
    refreshSnapshot: () => {
      forceRefreshRef.current = true
      setRefreshToken((current) => current + 1)
    },
  }
}
