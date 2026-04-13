import { httpClient } from '@/src/services/http/http-client';
import type { IntegracaoComErpDashboardSnapshot } from '@/src/features/integracao-com-erp-dashboard/services/integracao-com-erp-dashboard-types';

export const integracaoComErpDashboardClient = {
	async get() {
		return httpClient<IntegracaoComErpDashboardSnapshot>('/api/integracao-com-erp/dashboard', {
			method: 'GET',
			cache: 'no-store',
		});
	},
};
