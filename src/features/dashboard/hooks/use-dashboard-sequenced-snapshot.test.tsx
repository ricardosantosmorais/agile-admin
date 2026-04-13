import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDashboardSequencedSnapshot } from '@/src/features/dashboard/hooks/use-dashboard-sequenced-snapshot';
import { appData } from '@/src/services/app-data';

describe('useDashboardSequencedSnapshot', () => {
	const getSnapshotByBlocksMock = vi.spyOn(appData.dashboard, 'getSnapshotByBlocks');

	beforeEach(() => {
		window.localStorage.clear();
		getSnapshotByBlocksMock.mockReset();
		getSnapshotByBlocksMock.mockImplementation(async (_tenantId, _startDate, _endDate, rangeLabel, blocks) => ({
			rangeLabel,
			primaryMetrics: blocks?.includes('resumo') ? [{ label: 'Receita', value: 10, variation: 0, type: 'currency' }] : [],
			customerMetrics: blocks?.includes('clientes_resumo') ? [{ label: 'Clientes', value: 5, variation: 0, type: 'number' }] : [],
			serie: blocks?.includes('serie') ? [{ dia: '01/01', atual: 10, anterior: 5 }] : [],
			ticketByDay: [],
			channel: [],
			emitente: [],
			funil: [],
			monitoringAlerts: blocks?.includes('alertas') ? ['Atencao'] : [],
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
		}));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('loads summary and funnel on mount and waits for viewport requests for the others', async () => {
		const { result } = renderHook(() => useDashboardSequencedSnapshot('tenant-1'));

		await waitFor(() => {
			expect(result.current.completedPhases).toContain('summary');
			expect(result.current.completedPhases).toContain('funnel');
		});

		expect(result.current.selectedPreviousRange).not.toBeNull();

		expect(getSnapshotByBlocksMock).toHaveBeenCalledTimes(2);
		expect(getSnapshotByBlocksMock).toHaveBeenNthCalledWith(1, 'tenant-1', expect.any(String), expect.any(String), expect.any(String), ['resumo'], {
			forceRefresh: false,
			previousStart: expect.any(String),
			previousEnd: expect.any(String),
		});
		expect(getSnapshotByBlocksMock).toHaveBeenNthCalledWith(2, 'tenant-1', expect.any(String), expect.any(String), expect.any(String), ['funil'], {
			forceRefresh: false,
			previousStart: expect.any(String),
			previousEnd: expect.any(String),
		});

		result.current.requestPhases('series');

		await waitFor(() => {
			expect(result.current.completedPhases).toContain('series');
		});

		expect(getSnapshotByBlocksMock).toHaveBeenCalledTimes(3);
		expect(getSnapshotByBlocksMock).toHaveBeenNthCalledWith(3, 'tenant-1', expect.any(String), expect.any(String), expect.any(String), ['serie', 'alertas', 'resumo', 'funil', 'operacao'], {
			forceRefresh: false,
			previousStart: expect.any(String),
			previousEnd: expect.any(String),
		});
	});

	it('allows disabling the comparison period and reloads without previous dates', async () => {
		const { result } = renderHook(() => useDashboardSequencedSnapshot('tenant-1'));

		await waitFor(() => {
			expect(result.current.completedPhases).toContain('summary');
		});

		getSnapshotByBlocksMock.mockClear();

		act(() => {
			result.current.setSelectedPreviousRange(null);
		});

		await waitFor(() => {
			expect(getSnapshotByBlocksMock).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(result.current.completedPhases).toContain('funnel');
		});

		expect(getSnapshotByBlocksMock).toHaveBeenNthCalledWith(1, 'tenant-1', expect.any(String), expect.any(String), expect.any(String), ['resumo'], {
			forceRefresh: false,
			previousStart: null,
			previousEnd: null,
		});
		expect(getSnapshotByBlocksMock).toHaveBeenNthCalledWith(2, 'tenant-1', expect.any(String), expect.any(String), expect.any(String), ['funil'], {
			forceRefresh: false,
			previousStart: null,
			previousEnd: null,
		});
	});
});
