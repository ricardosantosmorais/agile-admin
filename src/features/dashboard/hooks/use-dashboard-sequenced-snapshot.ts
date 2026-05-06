'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createDashboardRequestCoordinator, createDashboardSnapshotRequestKey } from '@/src/features/dashboard/services/dashboard-request-pressure';
import { dashboardPresets, type DashboardSnapshot } from '@/src/features/dashboard/types/dashboard';
import { appData } from '@/src/services/app-data';

export type DashboardPhaseId = 'summary' | 'customers' | 'series' | 'funnel' | 'mix' | 'clients' | 'operations' | 'payments' | 'marketingMix' | 'marketingTops';

export type StoredDashboardRange = {
	label?: string;
	start: string;
	end: string;
	previousStart?: string | null;
	previousEnd?: string | null;
};

type DateRangeValue = {
	start: string;
	end: string;
};

function createAutomaticPreviousRange(range: DateRangeValue): DateRangeValue {
	const startDate = new Date(`${range.start}T00:00:00`);
	const endDate = new Date(`${range.end}T00:00:00`);
	const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
	const previousEnd = new Date(startDate);
	previousEnd.setDate(previousEnd.getDate() - 1);
	const previousStart = new Date(previousEnd);
	previousStart.setDate(previousStart.getDate() - days + 1);

	return {
		start: formatDateInput(previousStart),
		end: formatDateInput(previousEnd),
	};
}

type DashboardPhaseDefinition = {
	id: DashboardPhaseId;
	blocks: string[];
};

const STORAGE_KEY = 'dashboard';

const phaseDefinitions: DashboardPhaseDefinition[] = [
	{ id: 'summary', blocks: ['resumo'] },
	{ id: 'customers', blocks: ['clientes_resumo'] },
	{ id: 'series', blocks: ['serie', 'alertas', 'resumo', 'funil', 'operacao'] },
	{ id: 'funnel', blocks: ['funil'] },
	{ id: 'mix', blocks: ['mix'] },
	{ id: 'clients', blocks: ['clientes_listas', 'coorte'] },
	{ id: 'operations', blocks: ['produtos', 'operacao'] },
	{ id: 'payments', blocks: ['pagamentos', 'marketing_resumo'] },
	{ id: 'marketingMix', blocks: ['marketing_mix'] },
	{ id: 'marketingTops', blocks: ['marketing_tops'] },
];

const orderedPhaseIds = phaseDefinitions.map((phase) => phase.id);

function formatDateInput(date: Date) {
	return date.toISOString().slice(0, 10);
}

function getDefaultPresetRanges(today: Date) {
	return dashboardPresets.map((preset) => {
		if (preset.id === 'mes_atual') {
			const start = new Date(today.getFullYear(), today.getMonth(), 1);
			const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
			return {
				id: preset.id,
				label: preset.label,
				range: {
					start: formatDateInput(start),
					end: formatDateInput(end),
				},
			};
		}

		const end = new Date(today);
		const start = new Date(today);
		start.setDate(end.getDate() - (preset.days - 1));

		return {
			id: preset.id,
			label: preset.label,
			range: {
				start: formatDateInput(start),
				end: formatDateInput(end),
			},
		};
	});
}

function readStoredDashboardRange() {
	if (typeof window === 'undefined') {
		return null;
	}

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) {
			return null;
		}

		const parsed = JSON.parse(raw) as Partial<StoredDashboardRange>;
		if (!parsed.start || !parsed.end) {
			return null;
		}

		return {
			label: parsed.label,
			start: parsed.start,
			end: parsed.end,
			previousStart: parsed.previousStart ?? null,
			previousEnd: parsed.previousEnd ?? null,
		} satisfies StoredDashboardRange;
	} catch {
		return null;
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
	};
}

function mergePhaseSnapshot(current: DashboardSnapshot, partial: DashboardSnapshot, phaseId: DashboardPhaseId) {
	switch (phaseId) {
		case 'summary':
			return { ...current, rangeLabel: partial.rangeLabel, primaryMetrics: partial.primaryMetrics };
		case 'customers':
			return { ...current, customerMetrics: partial.customerMetrics };
		case 'series':
			return {
				...current,
				serie: partial.serie,
				ticketByDay: partial.ticketByDay,
				monitoringAlerts: partial.monitoringAlerts,
			};
		case 'funnel':
				return {
					...current,
					funil: partial.funil,
					primaryMetrics: current.primaryMetrics.map((metric, index) => {
						if (index !== 3) {
							return metric;
						}

						const conversionMetric = partial.primaryMetrics[3];
						return conversionMetric ?? metric;
					}),
				};
		case 'mix':
			return { ...current, channel: partial.channel, emitente: partial.emitente };
		case 'clients':
			return { ...current, topClients: partial.topClients, coorte: partial.coorte };
		case 'operations':
			return { ...current, topProducts: partial.topProducts, hourlyRevenue: partial.hourlyRevenue };
		case 'payments':
			return {
				...current,
				payments: partial.payments,
				marketingMetrics: partial.marketingMetrics,
				marketingTicketComparison: partial.marketingTicketComparison,
			};
		case 'marketingMix':
			return {
				...current,
				marketingMixExclusive: partial.marketingMixExclusive,
				marketingMixInclusive: partial.marketingMixInclusive,
			};
		case 'marketingTops':
			return { ...current, topCoupons: partial.topCoupons, topPromotions: partial.topPromotions };
		default:
			return current;
	}
}

function normalizeRequestedPhases(phaseIds: DashboardPhaseId[]) {
	const requested = new Set(phaseIds);
	return orderedPhaseIds.filter((phaseId) => requested.has(phaseId));
}

export function useDashboardSequencedSnapshot(tenantId: string) {
	const today = useMemo(() => new Date(), []);
	const presetRanges = useMemo(() => getDefaultPresetRanges(today), [today]);
	const [selectedRange, setSelectedRange] = useState<DateRangeValue>(() => {
		const stored = readStoredDashboardRange();
		return stored ? { start: stored.start, end: stored.end } : presetRanges[0].range;
	});
	const [selectedPreviousRange, setSelectedPreviousRange] = useState<DateRangeValue | null>(() => {
		const stored = readStoredDashboardRange();
		const baseRange = stored ? { start: stored.start, end: stored.end } : presetRanges[0].range;
		return createAutomaticPreviousRange(baseRange);
	});
	const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
	const [requestedPhases, setRequestedPhases] = useState<DashboardPhaseId[]>(['summary', 'funnel']);
	const [completedPhases, setCompletedPhases] = useState<DashboardPhaseId[]>([]);
	const [failedPhases, setFailedPhases] = useState<DashboardPhaseId[]>([]);
	const [error, setError] = useState('');
	const [refreshToken, setRefreshToken] = useState(0);
	const forceRefreshRef = useRef(false);
	const cycleForceRefreshRef = useRef(false);
	const requestCycleRef = useRef(0);
	const requestCoordinatorRef = useRef(createDashboardRequestCoordinator());
	const phaseWaitersRef = useRef<
		Array<{
			phaseIds: DashboardPhaseId[];
			resolve: () => void;
			reject: (error: Error) => void;
		}>
	>([]);

	const selectedRangeLabel = useMemo(() => {
		const preset = presetRanges.find((item) => item.range.start === selectedRange.start && item.range.end === selectedRange.end);
		if (preset) {
			return preset.label;
		}

		return `${selectedRange.start} a ${selectedRange.end}`;
	}, [presetRanges, selectedRange.end, selectedRange.start]);

	const currentPhase = useMemo(
		() => orderedPhaseIds.find((phaseId) => requestedPhases.includes(phaseId) && !completedPhases.includes(phaseId) && !failedPhases.includes(phaseId)) ?? null,
		[completedPhases, failedPhases, requestedPhases],
	);

	useEffect(() => {
		const coordinator = requestCoordinatorRef.current;
		return () => {
			coordinator.abortAll();
		};
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const stored: StoredDashboardRange = {
			label: selectedRangeLabel,
			start: selectedRange.start,
			end: selectedRange.end,
		};

		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
	}, [selectedRange.end, selectedRange.start, selectedRangeLabel]);

	useEffect(() => {
		const baseSnapshot = createEmptySnapshot(selectedRangeLabel);
		const nextCycleId = requestCycleRef.current + 1;
		requestCycleRef.current = nextCycleId;
		requestCoordinatorRef.current.abortStaleCycles(nextCycleId);
		cycleForceRefreshRef.current = forceRefreshRef.current;
		forceRefreshRef.current = false;

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setSnapshot(baseSnapshot);
		setCompletedPhases([]);
		setFailedPhases([]);
		setError('');
	}, [refreshToken, selectedRange.end, selectedRange.start, selectedRangeLabel, selectedPreviousRange, tenantId]);

	useEffect(() => {
		if (!currentPhase) {
			return;
		}

		const phaseDefinition = phaseDefinitions.find((entry) => entry.id === currentPhase);
		if (!phaseDefinition) {
			return;
		}

		const baseSnapshot = createEmptySnapshot(selectedRangeLabel);
		const phaseId = phaseDefinition.id;
		const phaseBlocks = phaseDefinition.blocks;
		const cycleId = requestCycleRef.current;
		const phaseOptions = {
			forceRefresh: cycleForceRefreshRef.current,
			previousStart: selectedPreviousRange?.start ?? null,
			previousEnd: selectedPreviousRange?.end ?? null,
		};
		const requestKey = createDashboardSnapshotRequestKey({
			tenantId,
			startDate: selectedRange.start,
			endDate: selectedRange.end,
			rangeLabel: selectedRangeLabel,
			blocks: phaseBlocks,
			...phaseOptions,
		});
		let cancelled = false;

		async function loadPhase() {
			try {
				const partial = await requestCoordinatorRef.current.run(requestKey, cycleId, ({ signal }) =>
					appData.dashboard.getSnapshotByBlocks(tenantId, selectedRange.start, selectedRange.end, selectedRangeLabel, phaseBlocks, {
						...phaseOptions,
						signal,
					}),
				);

				if (cancelled || requestCycleRef.current !== cycleId) {
					return;
				}

				setSnapshot((current) => mergePhaseSnapshot(current ?? baseSnapshot, partial, phaseId));
				setCompletedPhases((current) => (current.includes(phaseId) ? current : [...current, phaseId]));
			} catch (phaseError) {
				if (cancelled || requestCycleRef.current !== cycleId) {
					return;
				}

				const normalizedError = phaseError instanceof Error ? phaseError : new Error('Nao foi possivel carregar parte dos dados do dashboard.');

				setFailedPhases((current) => (current.includes(phaseId) ? current : [...current, phaseId]));
				setError(normalizedError.message);
			}
		}

		void loadPhase();

		return () => {
			cancelled = true;
		};
	}, [currentPhase, selectedRange.end, selectedRange.start, selectedRangeLabel, selectedPreviousRange, tenantId]);

	useEffect(() => {
		if (!cycleForceRefreshRef.current) {
			return;
		}

		const requested = normalizeRequestedPhases(requestedPhases);
		const concluded = new Set<DashboardPhaseId>([...completedPhases, ...failedPhases]);
		const hasPendingRequestedPhase = requested.some((phaseId) => !concluded.has(phaseId));

		if (!hasPendingRequestedPhase) {
			cycleForceRefreshRef.current = false;
		}
	}, [completedPhases, failedPhases, requestedPhases]);

	useEffect(() => {
		if (!phaseWaitersRef.current.length) {
			return;
		}

		const remainingWaiters: typeof phaseWaitersRef.current = [];

		for (const waiter of phaseWaitersRef.current) {
			const failedPhase = waiter.phaseIds.find((phaseId) => failedPhases.includes(phaseId));
			if (failedPhase) {
				waiter.reject(new Error(`Falha ao carregar a fase ${failedPhase} do dashboard.`));
				continue;
			}

			const isComplete = waiter.phaseIds.every((phaseId) => completedPhases.includes(phaseId));
			if (isComplete) {
				waiter.resolve();
				continue;
			}

			remainingWaiters.push(waiter);
		}

		phaseWaitersRef.current = remainingWaiters;
	}, [completedPhases, failedPhases]);

	function requestPhases(phaseIds: DashboardPhaseId | DashboardPhaseId[]) {
		const nextIds = Array.isArray(phaseIds) ? phaseIds : [phaseIds];

		setRequestedPhases((current) => {
			const normalized = normalizeRequestedPhases([...current, ...nextIds]);
			if (normalized.length === current.length && normalized.every((phaseId, index) => phaseId === current[index])) {
				return current;
			}

			return normalized;
		});
	}

	function ensurePhasesLoaded(phaseIds: DashboardPhaseId[]) {
		requestPhases(phaseIds);

		if (phaseIds.every((phaseId) => completedPhases.includes(phaseId))) {
			return Promise.resolve();
		}

		return new Promise<void>((resolve, reject) => {
			phaseWaitersRef.current.push({ phaseIds, resolve, reject });
		});
	}

	return {
		allPhaseIds: orderedPhaseIds,
		presetRanges,
		selectedRange,
		selectedRangeLabel,
		setSelectedRange,
		selectedPreviousRange,
		setSelectedPreviousRange,
		snapshot,
		requestedPhases,
		completedPhases,
		failedPhases,
		currentPhase,
		error,
		requestPhases,
		ensurePhasesLoaded,
		refreshSnapshot: () => {
			forceRefreshRef.current = true;
			setRefreshToken((current) => current + 1);
		},
	};
}
