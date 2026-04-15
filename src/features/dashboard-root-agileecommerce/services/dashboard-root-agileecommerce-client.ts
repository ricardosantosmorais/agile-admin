import { httpClient } from '@/src/services/http/http-client';
import { mapDashboardRootAgileecommercePayload } from '@/src/features/dashboard-root-agileecommerce/services/dashboard-root-agileecommerce-mapper';
import type { DashboardRootSnapshot } from '@/src/features/dashboard-root-agileecommerce/types/dashboard-root-agileecommerce';

type DashboardRootClientOptions = {
	startDate: string;
	endDate: string;
	blocks?: string[];
	previousStart?: string | null;
	previousEnd?: string | null;
	forceRefresh?: boolean;
	leads?: boolean;
};

export const dashboardRootAgileecommerceClient = {
	async getSnapshot(options: DashboardRootClientOptions): Promise<DashboardRootSnapshot> {
		const payload = await httpClient<unknown>('/api/dashboard-agileecommerce', {
			method: 'POST',
			cache: options.forceRefresh ? 'no-store' : 'default',
			body: JSON.stringify({
				startDate: options.startDate,
				endDate: options.endDate,
				blocks: options.leads ? [...(options.blocks ?? []), 'leads'] : options.blocks,
				previousStart: options.previousStart ?? null,
				previousEnd: options.previousEnd ?? null,
				forceRefresh: options.forceRefresh === true,
			}),
		});

		return mapDashboardRootAgileecommercePayload(payload);
	},
};
