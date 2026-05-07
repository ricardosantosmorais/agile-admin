export type DashboardSnapshotRequestKeyInput = {
	tenantId: string;
	startDate: string;
	endDate: string;
	rangeLabel: string;
	blocks?: string[];
	forceRefresh?: boolean;
	previousStart?: string | null;
	previousEnd?: string | null;
};

type DashboardRequestFactory<T> = (context: { signal: AbortSignal }) => Promise<T>;

type InflightDashboardRequest<T> = {
	cycleId: number;
	controller: AbortController;
	promise: Promise<T>;
};

export function createDashboardSnapshotRequestKey(input: DashboardSnapshotRequestKeyInput) {
	return JSON.stringify({
		tenantId: input.tenantId,
		startDate: input.startDate,
		endDate: input.endDate,
		rangeLabel: input.rangeLabel,
		blocks: input.blocks ?? ['all'],
		forceRefresh: input.forceRefresh === true,
		previousStart: input.previousStart ?? null,
		previousEnd: input.previousEnd ?? null,
	});
}

export function createDashboardRequestCoordinator() {
	const inflightRequests = new Map<string, InflightDashboardRequest<unknown>>();

	function run<T>(key: string, cycleId: number, factory: DashboardRequestFactory<T>) {
		const existing = inflightRequests.get(key);
		if (existing && existing.cycleId === cycleId) {
			return existing.promise as Promise<T>;
		}

		const controller = new AbortController();
		const entry: InflightDashboardRequest<T> = {
			cycleId,
			controller,
			promise: Promise.resolve().then(() => factory({ signal: controller.signal })),
		};

		entry.promise = entry.promise.finally(() => {
			if (inflightRequests.get(key) === entry) {
				inflightRequests.delete(key);
			}
		});

		inflightRequests.set(key, entry as InflightDashboardRequest<unknown>);
		return entry.promise;
	}

	function abortStaleCycles(activeCycleId: number) {
		for (const [key, entry] of inflightRequests.entries()) {
			if (entry.cycleId === activeCycleId) {
				continue;
			}

			entry.controller.abort();
			inflightRequests.delete(key);
		}
	}

	function abortAll() {
		for (const entry of inflightRequests.values()) {
			entry.controller.abort();
		}

		inflightRequests.clear();
	}

	return {
		run,
		abortStaleCycles,
		abortAll,
	};
}
