import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api';

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
	return typeof value === 'object' && value !== null ? (value as ApiRecord) : {};
}

function toStringValue(value: unknown) {
	return String(value ?? '').trim();
}

function getErrorMessage(payload: unknown, fallback: string) {
	const record = asRecord(payload);
	const error = asRecord(record.error);

	if (typeof error.message === 'string' && error.message.trim()) {
		return error.message.trim();
	}

	if (typeof record.message === 'string' && record.message.trim()) {
		return record.message.trim();
	}

	return fallback;
}

function normalizeOrderBy(value: string) {
	const allowed = new Set(['id_servico', 'nome_servico', 'nome_fantasia', 'intervalo_execucao', 'id_servico_execucao', 'data_hora', 'tentativas']);
	return allowed.has(value) ? value : 'data_hora';
}

function normalizeIds(value: unknown) {
	return (Array.isArray(value) ? value : [value]).map((entry) => toStringValue(entry)).filter(Boolean);
}

function buildCommandPayload(ids: string[], cargaGeral: 0 | 1) {
	return ids
		.map((id) => id.split('_'))
		.filter((parts) => parts.length >= 2 && parts[0] && parts[1])
		.map(([companyId, serviceId]) => ({
			id_empresa: companyId,
			id_servico: serviceId,
			carga_geral: cargaGeral,
		}));
}

async function postExternalJson(path: string, body: unknown) {
	const baseUrl = process.env.ADMIN_URL_API_AGILESYNC || '';
	const token = (process.env.ADMIN_API_AGILESYNC_TOKEN || process.env.ADMIN_API_PAINELB2B_TOKEN || '').trim();

	if (!baseUrl || !token) {
		return {
			ok: false,
			status: 500,
			payload: { message: 'API externa não configurada para a operação solicitada.' },
		};
	}

	const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
				Token: token,
				'X-API-TOKEN': token,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
			cache: 'no-store',
		});

		const contentType = response.headers.get('content-type') ?? '';
		const raw = await response.text();
		const payload = contentType.includes('application/json') && raw.trim() ? JSON.parse(raw) : raw;

		return {
			ok: response.ok,
			status: response.status,
			payload,
		};
	} catch (error) {
		return {
			ok: false,
			status: 500,
			payload: {
				message: error instanceof Error ? error.message : 'Falha inesperada ao chamar a API externa.',
			},
		};
	}
}

export async function GET(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const search = request.nextUrl.searchParams;
	const page = Math.max(1, Number(search.get('page') || 1));
	const perPage = Math.min(1000, Math.max(1, Number(search.get('perPage') || 15)));
	const orderBy = normalizeOrderBy(toStringValue(search.get('orderBy')));
	const sort = search.get('sort') === 'asc' ? 'asc' : 'desc';

	const query = new URLSearchParams({
		page: String(page),
		perpage: String(perPage),
		field: orderBy,
		sort,
	});

	const id = toStringValue(search.get('id'));
	const nome = toStringValue(search.get('nome'));
	const empresa = toStringValue(search.get('empresa'));
	const intervalo = toStringValue(search.get('intervalo'));
	const idExecucao = toStringValue(search.get('idExecucao'));

	if (id) {
		query.set('id_servico', id);
	}

	if (nome) {
		query.set('nome_servico:lk', nome);
	}

	if (empresa) {
		query.set('nome_fantasia:lk', empresa);
	}

	if (intervalo) {
		query.set('intervalo_execucao', intervalo);
	}

	if (idExecucao) {
		query.set('id_servico_execucao', idExecucao);
	}

	const result = await externalAdminApiFetch('agilesync', 'agilesync_servicos_bad', {
		method: 'GET',
		query,
	});

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar os serviços com falha do ERP.') }, { status: result.status || 400 });
	}

	const payload = asRecord(result.payload);
	return NextResponse.json({
		data: Array.isArray(payload.data) ? payload.data : [],
		meta: asRecord(payload.meta),
	});
}

export async function POST(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const action = toStringValue(asRecord(body).action).toLowerCase();
	const ids = normalizeIds(asRecord(body).ids);

	if (!ids.length) {
		return NextResponse.json({ message: 'Selecione ao menos um serviço para continuar.' }, { status: 400 });
	}

	if (action !== 'execute' && action !== 'reload') {
		return NextResponse.json({ message: 'Ação inválida para serviços com falha.' }, { status: 400 });
	}

	const result = await postExternalJson('servicos_executar', buildCommandPayload(ids, action === 'reload' ? 1 : 0));

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível enviar o comando ao integrador.') }, { status: result.status || 400 });
	}

	return NextResponse.json({
		success: true,
		message: 'Comando enviado ao integrador com sucesso.',
	});
}
