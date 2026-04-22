'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { dashboardRootAgileecommerceClient } from '@/src/features/dashboard-root-agileecommerce/services/dashboard-root-agileecommerce-client';
import type { DashboardRootSnapshot } from '@/src/features/dashboard-root-agileecommerce/types/dashboard-root-agileecommerce';

export type DashboardRootPhaseId = 'summary' | 'analytics' | 'platform' | 'product' | 'engagement' | 'operations' | 'ai';

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
	{ id: 'summary', blocks: ['resumo', 'analytics'] },
	{ id: 'analytics', blocks: ['analytics'] },
	{ id: 'platform', blocks: ['empresas'] },
	{ id: 'product', blocks: ['apps'] },
	{ id: 'engagement', blocks: ['push'] },
	{ id: 'operations', blocks: ['processos'] },
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

	switch (phaseId) {
		case 'summary':
			return {
				...base,
				meta: partial.meta,
				resumo: partial.resumo,
				analytics: partial.analytics,
			};
		case 'platform':
			return {
				...base,
				empresas: partial.empresas,
			};
		case 'product':
			return {
				...base,
				apps: partial.apps,
			};
		case 'engagement':
			return {
				...base,
				push: partial.push,
			};
		case 'analytics':
			return {
				...base,
				analytics: partial.analytics,
			};
		case 'operations':
			return {
				...base,
				processos: partial.processos,
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
