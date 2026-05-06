import { describe, expect, it } from 'vitest';
import { createDashboardRequestCoordinator, createDashboardSnapshotRequestKey } from '@/src/features/dashboard/services/dashboard-request-pressure';

describe('dashboard request pressure coordinator', () => {
	it('creates a stable key for equivalent snapshot requests', () => {
		const key = createDashboardSnapshotRequestKey({
			tenantId: 'tenant-1',
			startDate: '2026-05-01',
			endDate: '2026-05-31',
			rangeLabel: 'Maio',
			blocks: ['resumo', 'funil'],
			forceRefresh: false,
			previousStart: '2026-04-01',
			previousEnd: '2026-04-30',
		});

		expect(key).toBe(
			createDashboardSnapshotRequestKey({
				tenantId: 'tenant-1',
				startDate: '2026-05-01',
				endDate: '2026-05-31',
				rangeLabel: 'Maio',
				blocks: ['resumo', 'funil'],
				forceRefresh: false,
				previousStart: '2026-04-01',
				previousEnd: '2026-04-30',
			}),
		);
	});

	it('deduplicates identical in-flight requests in the same dashboard cycle', async () => {
		const coordinator = createDashboardRequestCoordinator();
		let resolveRequest: (value: string) => void = () => undefined;
		let calls = 0;
		const source = new Promise<string>((resolve) => {
			resolveRequest = resolve;
		});

		const firstRequest = coordinator.run('same-key', 1, async () => {
			calls += 1;
			return source;
		});
		const secondRequest = coordinator.run('same-key', 1, async () => {
			calls += 1;
			return 'unexpected';
		});

		expect(secondRequest).toBe(firstRequest);
		expect(calls).toBe(0);

		resolveRequest('ok');

		await expect(firstRequest).resolves.toBe('ok');
		await expect(secondRequest).resolves.toBe('ok');
		expect(calls).toBe(1);
	});

	it('aborts stale dashboard cycles and allows the next cycle to request again', async () => {
		const coordinator = createDashboardRequestCoordinator();
		const oldSignals: AbortSignal[] = [];
		let calls = 0;

		const oldRequest = coordinator.run('same-key', 1, async ({ signal }) => {
			calls += 1;
			oldSignals.push(signal);
			return new Promise<string>((_resolve, reject) => {
				signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
			});
		});

		await Promise.resolve();
		coordinator.abortStaleCycles(2);

		const [oldSignal] = oldSignals;
		if (!oldSignal) {
			throw new Error('Expected dashboard request signal.');
		}

		expect(oldSignal.aborted).toBe(true);
		await expect(oldRequest).rejects.toThrow('Aborted');

		const nextRequest = coordinator.run('same-key', 2, async ({ signal }) => {
			calls += 1;
			expect(signal.aborted).toBe(false);
			return 'next-ok';
		});

		await expect(nextRequest).resolves.toBe('next-ok');
		expect(calls).toBe(2);
	});
});
