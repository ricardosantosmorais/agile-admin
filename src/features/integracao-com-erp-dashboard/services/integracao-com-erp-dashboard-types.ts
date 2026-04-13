export type IntegracaoComErpDashboardConnectionSummary = {
	connected: number;
	disconnected: number;
};

export type IntegracaoComErpDashboardOrderSummary = {
	total: number;
	internalized: number;
	pending: number;
};

export type IntegracaoComErpDashboardCompanyConnectionRow = {
	id: string;
	name: string;
	logoUrl: string;
	status: string;
	disconnectedAt: string;
};

export type IntegracaoComErpDashboardPendingCompanyRow = {
	id: string;
	name: string;
	logoUrl: string;
	pendingToday: number;
	pendingLast30Days: number;
	pendingAt: string;
};

export type IntegracaoComErpDashboardFailureDetail = {
	label: string;
	value: string;
};

export type IntegracaoComErpDashboardFailureRow = {
	executionId: string;
	companyId: string;
	companyName: string;
	companyLogoUrl: string;
	serviceName: string;
	startedAt: string;
	metadataDetails: IntegracaoComErpDashboardFailureDetail[];
	metadataRaw: string;
};

export type IntegracaoComErpDashboardServiceSummary = {
	total: number;
	finalized: number;
	failed: number;
};

export type IntegracaoComErpDashboardSnapshot = {
	integrators: IntegracaoComErpDashboardConnectionSummary;
	disconnectedCompanies: IntegracaoComErpDashboardCompanyConnectionRow[];
	orders: {
		today: IntegracaoComErpDashboardOrderSummary;
		last30Days: IntegracaoComErpDashboardOrderSummary;
		pendingCompanies: IntegracaoComErpDashboardPendingCompanyRow[];
	};
	services: IntegracaoComErpDashboardServiceSummary;
	failedServices: IntegracaoComErpDashboardFailureRow[];
	refreshedAt: string;
};
