'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { dashboardRootAgileecommerceClient } from '@/src/features/dashboard-root-agileecommerce/services/dashboard-root-agileecommerce-client';
import type { DashboardRootSnapshot } from '@/src/features/dashboard-root-agileecommerce/types/dashboard-root-agileecommerce';

export type DashboardRootPhaseId =
	| 'summary'
	| 'commercial'
	| 'analyticsCommercial'
	| 'analyticsOps'
	| 'platform'
	| 'productSummary'
	| 'productDetail'
	| 'engagementSummary'
	| 'engagementDetail'
	| 'operationsSummary'
	| 'operationsDetail'
	| 'ai';

type UseDashboardRootSequencedSnapshotOptions = {
	startDate: string;
	endDate: string;
	previousStart?: string | null;
	previousEnd?: string | null;
};

type DashboardRootPhaseDefinition = {
	id: DashboardRootPhaseId;
	blocks: string[];
};

type DashboardRootSequenceState = {
	key: string;
	snapshot: DashboardRootSnapshot | null;
	requestedPhases: DashboardRootPhaseId[];
	completedPhases: DashboardRootPhaseId[];
	failedPhases: DashboardRootPhaseId[];
	error: string;
};

const phaseDefinitions: DashboardRootPhaseDefinition[] = [
	{ id: 'summary', blocks: ['analytics_headline'] },
	{ id: 'commercial', blocks: ['analytics_trust', 'analytics_pulse'] },
	{ id: 'analyticsCommercial', blocks: ['analytics_commercial'] },
	{ id: 'analyticsOps', blocks: ['analytics_operations'] },
	{ id: 'platform', blocks: ['empresas'] },
	{ id: 'productSummary', blocks: ['apps_headline'] },
	{ id: 'productDetail', blocks: ['apps_detail'] },
	{ id: 'engagementSummary', blocks: ['push_headline'] },
	{ id: 'engagementDetail', blocks: ['push_detail'] },
	{ id: 'operationsSummary', blocks: ['processos_headline'] },
	{ id: 'operationsDetail', blocks: ['processos_detail'] },
	{ id: 'ai', blocks: ['agent', 'audit'] },
];

const orderedPhaseIds = phaseDefinitions.map((phase) => phase.id);

function normalizeRequestedPhases(phaseIds: DashboardRootPhaseId[]) {
	const requested = new Set(phaseIds);
	return orderedPhaseIds.filter((phaseId) => requested.has(phaseId));
}

function createSequenceState(key: string): DashboardRootSequenceState {
	return {
		key,
		snapshot: null,
		requestedPhases: ['summary'],
		completedPhases: [],
		failedPhases: [],
		error: '',
	};
}

function mergePhaseSnapshot(current: DashboardRootSnapshot | null, partial: DashboardRootSnapshot, phaseId: DashboardRootPhaseId) {
	const base = current ?? partial;
	const mergeAnalytics = () => {
		if (!partial.analytics) {
			return current?.analytics;
		}

		const currentAnalytics = current?.analytics ?? {};
		return {
			...currentAnalytics,
			...partial.analytics,
			resumo:
				currentAnalytics.resumo || partial.analytics.resumo
					? {
							...(currentAnalytics.resumo ?? {}),
							...(partial.analytics.resumo ?? {}),
						}
					: undefined,
			comparativo: partial.analytics.comparativo ?? currentAnalytics.comparativo,
			confianca:
				currentAnalytics.confianca || partial.analytics.confianca
					? {
							...(currentAnalytics.confianca ?? {}),
							...(partial.analytics.confianca ?? {}),
						}
					: undefined,
			sincronizacao_resumo:
				currentAnalytics.sincronizacao_resumo || partial.analytics.sincronizacao_resumo
					? {
							...(currentAnalytics.sincronizacao_resumo ?? {}),
							...(partial.analytics.sincronizacao_resumo ?? {}),
						}
					: undefined,
		} as DashboardRootSnapshot['analytics'];
	};
	const mergedAnalytics = mergeAnalytics();

	switch (phaseId) {
		case 'summary':
			return {
				...base,
				meta: partial.meta,
				resumo: partial.resumo,
				analytics: mergedAnalytics,
			};
		case 'commercial':
			return {
				...base,
				analytics: mergedAnalytics,
			};
		case 'platform':
			return {
				...base,
				empresas: partial.empresas,
			};
		case 'productSummary':
		case 'productDetail':
			return {
				...base,
				apps: {
					...(current?.apps ?? {}),
					...(partial.apps ?? {}),
				},
			};
		case 'engagementSummary':
		case 'engagementDetail':
			return {
				...base,
				push: {
					...(current?.push ?? {}),
					...(partial.push ?? {}),
				},
			};
		case 'analyticsCommercial':
		case 'analyticsOps':
			return {
				...base,
				analytics: mergedAnalytics,
			};
		case 'operationsSummary':
		case 'operationsDetail':
			return {
				...base,
				processos: {
					...(current?.processos ?? {}),
					...(partial.processos ?? {}),
				},
			};
		case 'ai':
			return {
				...base,
				agent: partial.agent,
				audit: partial.audit,
			};
		default:
			return base;
	}
}

export function useDashboardRootSequencedSnapshot({ startDate, endDate, previousStart = null, previousEnd = null }: UseDashboardRootSequencedSnapshotOptions) {
	const [refreshToken, setRefreshToken] = useState(0);
	const requestKey = useMemo(() => JSON.stringify([startDate, endDate, previousStart, previousEnd, refreshToken]), [endDate, previousEnd, previousStart, refreshToken, startDate]);
	const [state, setState] = useState<DashboardRootSequenceState>(() => createSequenceState(requestKey));
	const forceRefreshRef = useRef(false);
	const cycleForceRefreshRef = useRef(false);
	const lastRequestKeyRef = useRef(requestKey);
	const isCurrentState = state.key === requestKey;
	const snapshot = isCurrentState ? state.snapshot : null;
	const requestedPhases = useMemo<DashboardRootPhaseId[]>(() => (isCurrentState ? state.requestedPhases : ['summary']), [isCurrentState, state.requestedPhases]);
	const completedPhases = useMemo<DashboardRootPhaseId[]>(() => (isCurrentState ? state.completedPhases : []), [isCurrentState, state.completedPhases]);
	const failedPhases = useMemo<DashboardRootPhaseId[]>(() => (isCurrentState ? state.failedPhases : []), [isCurrentState, state.failedPhases]);
	const error = isCurrentState ? state.error : '';

	const currentPhase = useMemo(
		() => orderedPhaseIds.find((phaseId) => requestedPhases.includes(phaseId) && !completedPhases.includes(phaseId) && !failedPhases.includes(phaseId)) ?? null,
		[completedPhases, failedPhases, requestedPhases],
	);

	useEffect(() => {
		if (lastRequestKeyRef.current === requestKey) {
			return;
		}

		cycleForceRefreshRef.current = forceRefreshRef.current;
		forceRefreshRef.current = false;
		lastRequestKeyRef.current = requestKey;
	}, [requestKey]);

	useEffect(() => {
		if (!currentPhase) {
			return;
		}

		const phaseId = currentPhase;
		const phaseDefinition = phaseDefinitions.find((phase) => phase.id === phaseId);
		if (!phaseDefinition) {
			return;
		}
		const phaseBlocks = phaseDefinition.blocks;

		let cancelled = false;

		async function loadPhase() {
			try {
				const partial = await dashboardRootAgileecommerceClient.getSnapshot({
					startDate,
					endDate,
					previousStart,
					previousEnd,
					blocks: phaseBlocks,
					forceRefresh: cycleForceRefreshRef.current,
				});

				if (cancelled) {
					return;
				}

				setState((current) => {
					const base = current.key === requestKey ? current : createSequenceState(requestKey);
					const nextCompleted = base.completedPhases.includes(phaseId) ? base.completedPhases : [...base.completedPhases, phaseId];

					return {
						...base,
						snapshot: mergePhaseSnapshot(base.snapshot, partial, phaseId),
						completedPhases: nextCompleted,
					};
				});
			} catch (phaseError) {
				if (cancelled) {
					return;
				}

				const normalizedError = phaseError instanceof Error ? phaseError : new Error('Não foi possível carregar parte dos dados do dashboard root.');
				setState((current) => {
					const base = current.key === requestKey ? current : createSequenceState(requestKey);
					const nextFailed = base.failedPhases.includes(phaseId) ? base.failedPhases : [...base.failedPhases, phaseId];

					return {
						...base,
						failedPhases: nextFailed,
						error: normalizedError.message,
					};
				});
			}
		}

		void loadPhase();

		return () => {
			cancelled = true;
		};
	}, [currentPhase, endDate, previousEnd, previousStart, requestKey, startDate]);

	useEffect(() => {
		if (!cycleForceRefreshRef.current) {
			return;
		}

		const requested = normalizeRequestedPhases(requestedPhases);
		const concluded = new Set<DashboardRootPhaseId>([...completedPhases, ...failedPhases]);
		const hasPendingRequestedPhase = requested.some((phaseId) => !concluded.has(phaseId));

		if (!hasPendingRequestedPhase) {
			cycleForceRefreshRef.current = false;
		}
	}, [completedPhases, failedPhases, requestedPhases]);

	function requestPhases(phaseIds: DashboardRootPhaseId | DashboardRootPhaseId[]) {
		const nextIds = Array.isArray(phaseIds) ? phaseIds : [phaseIds];

		setState((current) => {
			const base = current.key === requestKey ? current : createSequenceState(requestKey);
			const normalized = normalizeRequestedPhases([...base.requestedPhases, ...nextIds]);
			if (normalized.length === base.requestedPhases.length && normalized.every((phaseId, index) => phaseId === base.requestedPhases[index])) {
				return base;
			}

			return {
				...base,
				requestedPhases: normalized,
			};
		});
	}

	return {
		snapshot,
		completedPhases,
		failedPhases,
		error,
		requestPhases,
		refreshSnapshot: () => {
			forceRefreshRef.current = true;
			setRefreshToken((current) => current + 1);
		},
	};
}
