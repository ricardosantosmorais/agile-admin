import { NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { normalizeRelatorioDetail } from '@/src/features/relatorios/services/relatorios-mappers';
import type { RelatorioFiltroDinamico } from '@/src/features/relatorios/services/relatorios-types';
import { decryptLegacyAdminValue, isLatin1ByteString } from '@/src/lib/legacy-crypto';
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api';
import { serverApiFetch } from '@/src/services/http/server-api';

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown) {
	return typeof value === 'object' && value !== null ? (value as ApiRecord) : {};
}

function asArray(value: unknown) {
	return Array.isArray(value) ? value : [];
}

export function extractApiErrorMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null) {
		if ('message' in payload && typeof payload.message === 'string') return payload.message;
		const error = 'error' in payload ? payload.error : null;
		if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
			return error.message;
		}
	}

	if (typeof payload === 'string' && payload.trim()) {
		return payload.trim();
	}

	return fallback;
}

export function resolveRelatorioSortField(orderBy: string) {
	if (orderBy === 'grupo') return 'grupo:nome';
	if (orderBy === 'nome') return 'nome';
	return 'codigo';
}

export function resolveProcessSortField(orderBy: string) {
	if (orderBy === 'usuario') return 'usuario:nome';
	if (orderBy === 'created_at') return 'created_at';
	if (orderBy === 'status') return 'status';
	return 'id';
}

export async function resolveRelatorioContext(id: string) {
	try {
		const session = await readAuthSession();
		if (!session?.token || !session.currentTenantId) {
			return {
				error: NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 }),
			};
		}

		const relatorioResponse = await serverApiFetch(`relatorios?id=${encodeURIComponent(id)}&embed=grupo`, {
			method: 'GET',
			token: session.token,
			tenantId: session.currentTenantId,
		});

		if (!relatorioResponse.ok) {
			return {
				error: NextResponse.json(
					{ message: extractApiErrorMessage(relatorioResponse.payload, 'Não foi possível carregar o relatório.') },
					{ status: relatorioResponse.status || 400 },
				),
			};
		}

		const relatorioRecord = asArray(asRecord(relatorioResponse.payload).data)[0];
		if (!relatorioRecord) {
			return {
				error: NextResponse.json({ message: 'Relatório não encontrado.' }, { status: 404 }),
			};
		}

		const parametrosResponse = await serverApiFetch(`empresas/parametros?id_empresa=${encodeURIComponent(session.currentTenantId)}&order=chave,posicao&perpage=1000`, {
			method: 'GET',
			token: session.token,
			tenantId: session.currentTenantId,
		});

		if (!parametrosResponse.ok) {
			return {
				error: NextResponse.json(
					{ message: extractApiErrorMessage(parametrosResponse.payload, 'Não foi possível carregar os parâmetros da empresa.') },
					{ status: parametrosResponse.status || 400 },
				),
			};
		}

		const parametros = asArray(asRecord(parametrosResponse.payload).data);
		const portalTokenParam = parametros.find((item) => asRecord(item).chave === 'portal_token');
		const encryptedPortalToken = String(asRecord(portalTokenParam).parametros || '').trim();

		if (!encryptedPortalToken) {
			return {
				error: NextResponse.json({ message: 'Parâmetro portal_token não configurado para a empresa ativa.' }, { status: 409 }),
			};
		}

		let portalToken = '';
		try {
			portalToken = decryptLegacyAdminValue(encryptedPortalToken);
		} catch (error) {
			return {
				error: NextResponse.json({ message: error instanceof Error ? error.message : 'Não foi possível descriptografar o portal_token.' }, { status: 500 }),
			};
		}

		if (!portalToken) {
			return {
				error: NextResponse.json({ message: 'portal_token inválido para a empresa ativa.' }, { status: 409 }),
			};
		}

		if (!isLatin1ByteString(portalToken)) {
			return {
				error: NextResponse.json(
					{
						message: 'portal_token inválido após descriptografia. Verifique ADMIN_LEGACY_DECRYPT_KEY e ADMIN_LEGACY_DECRYPT_IV no ambiente ativo.',
					},
					{ status: 409 },
				),
			};
		}

		const reportApi = String(asRecord(relatorioRecord).api || '').trim();
		if (!reportApi) {
			return {
				error: NextResponse.json({ message: 'O relatório não possui integração externa configurada.' }, { status: 409 }),
			};
		}

		const headerResponse = await externalAdminApiFetch('painelb2b', reportApi, {
			method: 'GET',
			query: { header: 'only' },
			tokenOverride: portalToken,
		});

		if (!headerResponse.ok) {
			return {
				error: NextResponse.json(
					{ message: extractApiErrorMessage(headerResponse.payload, 'Não foi possível carregar os filtros dinâmicos do relatório.') },
					{ status: headerResponse.status || 400 },
				),
			};
		}

		return {
			context: {
				session,
				report: normalizeRelatorioDetail(relatorioRecord, headerResponse.payload),
				portalToken,
			},
		};
	} catch (error) {
		return {
			error: NextResponse.json({ message: error instanceof Error ? error.message : 'Não foi possível carregar o relatório.' }, { status: 500 }),
		};
	}
}

export function buildDynamicProcessFields(fields: RelatorioFiltroDinamico[], valores: Record<string, string>) {
	const items: Array<Record<string, string>> = [];

	for (const field of fields) {
		if (field.tipo === 'data') {
			const start = String(valores[`${field.campo}__start`] || '').trim();
			const end = String(valores[`${field.campo}__end`] || '').trim();

			if (start) {
				items.push({ campo: field.campo, tipo: field.tipo, titulo: field.titulo, operador: 'ge', valor: start });
			}
			if (end) {
				items.push({ campo: field.campo, tipo: field.tipo, titulo: field.titulo, operador: 'le', valor: end });
			}
			continue;
		}

		if (field.tipo === 'inteiro') {
			const start = String(valores[`${field.campo}__start`] || '').replace(/\D/g, '');
			const end = String(valores[`${field.campo}__end`] || '').replace(/\D/g, '');

			if (start) {
				items.push({ campo: field.campo, tipo: field.tipo, titulo: field.titulo, operador: 'ge', valor: start });
			}
			if (end) {
				items.push({ campo: field.campo, tipo: field.tipo, titulo: field.titulo, operador: 'le', valor: end });
			}
			continue;
		}

		if (field.tipo === 'valor') {
			const normalizeMoney = (input: string) =>
				input
					.replace(/\./g, '')
					.replace(',', '.')
					.replace(/[^\d.-]/g, '');
			const start = String(valores[`${field.campo}__start`] || '').trim();
			const end = String(valores[`${field.campo}__end`] || '').trim();

			if (start) {
				items.push({ campo: field.campo, tipo: field.tipo, titulo: field.titulo, operador: 'ge', valor: normalizeMoney(start) });
			}
			if (end) {
				items.push({ campo: field.campo, tipo: field.tipo, titulo: field.titulo, operador: 'le', valor: normalizeMoney(end) });
			}
			continue;
		}

		const value = String(valores[field.campo] || '').trim();
		if (!value) continue;
		items.push({ campo: field.campo, tipo: field.tipo, titulo: field.titulo, operador: 'lk', valor: value });
	}

	return items;
}
