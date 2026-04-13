import { NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { mapIntegracaoComErpDashboardSnapshot } from '@/src/features/integracao-com-erp-dashboard/services/integracao-com-erp-dashboard-mappers';
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api';

function getErrorMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'string' && payload.trim()) {
		return payload;
	}

	if (typeof payload === 'object' && payload !== null) {
		if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
			return payload.error.message;
		}

		if ('message' in payload && typeof payload.message === 'string') {
			return payload.message;
		}
	}

	return fallback;
}

function formatLegacyDate(daysAgo: number) {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);

	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear());

	return `${day}/${month}/${year}`;
}

export async function GET() {
	const session = await readAuthSession();

	if (!session?.token || !session.currentTenantId) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const companyCatalogPromise = externalAdminApiFetch('painelb2b', 'ecom_empresas', {
		method: 'GET',
		query: { perpage: 999 },
	});
	const integratorStatusPromise = externalAdminApiFetch('painelb2b', 'status_integradores', {
		method: 'GET',
	});
	const serviceSummaryPromise = externalAdminApiFetch('painelb2b', 'agilesync_resumo_servicos', {
		method: 'GET',
		query: { perpage: 999 },
	});
	const disconnectedCompaniesPromise = externalAdminApiFetch('painelb2b', 'agilesync_empresas_desconectadas', {
		method: 'GET',
		query: { perpage: 9999 },
	});
	const orderTodayPromise = externalAdminApiFetch('painelb2b', 'ecom_situacao_integracao_pedidos', {
		method: 'GET',
		query: { page: 1, perpage: 1000 },
	});
	const orderLast30Promise = externalAdminApiFetch('painelb2b', 'ecom_situacao_integracao_pedidos', {
		method: 'GET',
		query: { page: 1, perpage: 1000, data_inicial: formatLegacyDate(30) },
	});
	const failuresPromise = externalAdminApiFetch('painelb2b', 'agilesync_falhas_dashboard', {
		method: 'GET',
		query: { perpage: 999 },
	});

	const [companyCatalogResult, integratorStatusResult, serviceSummaryResult, disconnectedCompaniesResult, orderTodayResult, orderLast30Result, failuresResult] = await Promise.all([
		companyCatalogPromise,
		integratorStatusPromise,
		serviceSummaryPromise,
		disconnectedCompaniesPromise,
		orderTodayPromise,
		orderLast30Promise,
		failuresPromise,
	]);

	if (!integratorStatusResult.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(integratorStatusResult.payload, 'Não foi possível carregar o status dos integradores.') },
			{ status: integratorStatusResult.status || 400 },
		);
	}

	if (!serviceSummaryResult.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(serviceSummaryResult.payload, 'Não foi possível carregar o resumo dos serviços.') },
			{ status: serviceSummaryResult.status || 400 },
		);
	}

	if (!disconnectedCompaniesResult.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(disconnectedCompaniesResult.payload, 'Não foi possível carregar os integradores desconectados.') },
			{ status: disconnectedCompaniesResult.status || 400 },
		);
	}

	if (!orderTodayResult.ok || !orderLast30Result.ok) {
		const failedPayload = orderTodayResult.ok ? orderLast30Result.payload : orderTodayResult.payload;
		const failedStatus = orderTodayResult.ok ? orderLast30Result.status : orderTodayResult.status;
		return NextResponse.json({ message: getErrorMessage(failedPayload, 'Não foi possível carregar a situação de integração dos pedidos.') }, { status: failedStatus || 400 });
	}

	if (!failuresResult.ok) {
		return NextResponse.json({ message: getErrorMessage(failuresResult.payload, 'Não foi possível carregar os serviços com falha.') }, { status: failuresResult.status || 400 });
	}

	const snapshot = mapIntegracaoComErpDashboardSnapshot({
		integratorStatusPayload: integratorStatusResult.payload,
		serviceSummaryPayload: serviceSummaryResult.payload,
		disconnectedCompaniesPayload: disconnectedCompaniesResult.payload,
		orderTodayPayload: orderTodayResult.payload,
		orderLast30Payload: orderLast30Result.payload,
		failuresPayload: failuresResult.payload,
		companyCatalogPayload: companyCatalogResult.ok ? companyCatalogResult.payload : null,
	});

	return NextResponse.json(snapshot);
}
