import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { normalizeIntegracaoComErpRotinasIntegradasResponse } from '@/src/features/integracao-com-erp-rotinas-integradas/services/integracao-com-erp-rotinas-integradas-mappers';
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api';
import { serverApiFetch } from '@/src/services/http/server-api';

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
	return typeof value === 'object' && value !== null ? (value as ApiRecord) : {};
}

function asArray(value: unknown) {
	return Array.isArray(value) ? value : [];
}

function toStringValue(value: unknown) {
	return String(value ?? '').trim();
}

function getErrorMessage(payload: unknown, fallback: string) {
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

function resolveErpId(companyErp: string) {
	const normalized = companyErp.toLowerCase();
	if (normalized === 'winthor') {
		return '1';
	}

	if (normalized === 'protheus') {
		return '7';
	}

	return '0';
}

export async function GET(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const search = request.nextUrl.searchParams;
	const page = Math.max(1, Number(search.get('page') || 1));
	const perPage = Math.min(100, Math.max(1, Number(search.get('perPage') || 15)));
	const orderBy = String(search.get('orderBy') || 'codigo').trim();
	const sort = search.get('sort') === 'desc' ? 'desc' : 'asc';
	const codigo = String(search.get('codigo') || '').trim();
	const modulo = String(search.get('modulo') || '').trim();
	const nome = String(search.get('nome') || '').trim();

	const companyResult = await serverApiFetch(`empresas?id=${encodeURIComponent(session.currentTenantId)}&perpage=1`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	});

	if (!companyResult.ok) {
		return NextResponse.json({ message: getErrorMessage(companyResult.payload, 'Não foi possível carregar os dados da empresa.') }, { status: companyResult.status || 400 });
	}

	const company = asRecord(asArray(asRecord(companyResult.payload).data)[0]);
	const query = new URLSearchParams({
		page: String(page),
		perpage: String(perPage),
		field: orderBy,
		sort,
		id_erp: resolveErpId(toStringValue(company.erp)),
		integrado: '1',
	});

	if (codigo) {
		query.set('codigo', codigo);
	}

	if (modulo) {
		query.set('modulo', modulo);
	}

	if (nome) {
		query.set('nome:lk', `%${nome}%`);
	}

	const result = await externalAdminApiFetch('agilesync', 'erp_rotinas', {
		method: 'GET',
		query,
	});

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar as rotinas integradas do ERP.') }, { status: result.status || 400 });
	}

	return NextResponse.json(normalizeIntegracaoComErpRotinasIntegradasResponse(result.payload, { page, perPage }));
}
