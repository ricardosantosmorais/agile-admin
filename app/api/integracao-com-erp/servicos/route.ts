import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api';
import { serverApiFetch } from '@/src/services/http/server-api';

type ApiRecord = Record<string, unknown>;

type TenantContext = {
	companyCode: string;
	companyTemplateId: string;
	userId: string;
	token: string;
	currentTenantId: string;
};

function asRecord(value: unknown): ApiRecord {
	return typeof value === 'object' && value !== null ? (value as ApiRecord) : {};
}

function asArray<T = unknown>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

function toStringValue(value: unknown) {
	return String(value ?? '').trim();
}

function toBooleanValue(value: unknown) {
	const normalized = toStringValue(value).toLowerCase();
	return ['1', 'true', 'sim', 'yes'].includes(normalized);
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

function normalizeSlug(value: unknown) {
	return toStringValue(value).toLowerCase();
}

function decodeAmpEntities(value: string) {
	return value
		.replace(/&amp;/gi, '&')
		.replace(/&quot;/gi, '"')
		.replace(/&#039;/gi, "'")
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>');
}

function formatTipoObjetoLabel(tipoObjeto: unknown) {
	const normalized = normalizeSlug(tipoObjeto);

	if (normalized === 'query') return 'Query';
	if (normalized === 'acao') return 'Ação';
	if (normalized === 'endpoint_gateway') return 'Endpoint';
	if (normalized === 'script') return 'Script';
	if (normalized === 'implementacao') return 'Implementação';
	if (normalized === 'imagens') return 'Imagens';
	if (normalized === 'imagenslista') return 'Imagens (Lista)';
	if (normalized === 'imagenssftp') return 'Imagens (SFTP)';
	if (normalized === 'imagensdatabase') return 'Imagens (Banco)';
	if (!normalized) return 'Não identificado';

	return normalized.replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function formatTipoExecucaoLabel(tipoExecucao: unknown) {
	const original = toStringValue(tipoExecucao);
	const normalized = original.toLowerCase();

	if (!normalized) return 'Não informado';
	if (normalized === 'comparacao') return 'Comparação';
	if (normalized === 'configuracao') return 'Configuração';
	if (normalized === 'gravacaoapi') return 'Gravação API';
	if (normalized === 'retornoapi') return 'Retorno API';
	if (normalized === 'leituraapi') return 'Leitura API';
	if (normalized === 'comparacaoapi') return 'Comparação API';

	return original.replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function resolveNatureza(tipoObjeto: unknown, tipoExecucao: unknown) {
	const objectSlug = normalizeSlug(tipoObjeto);
	const executionSlug = normalizeSlug(tipoExecucao);

	if (objectSlug === 'acao') {
		return { chave: 'gravacao', label: 'Gravação' };
	}

	if (['query', 'endpoint_gateway', 'imagens', 'imagenslista', 'imagenssftp', 'imagensdatabase'].includes(objectSlug)) {
		return { chave: 'extracao', label: 'Extração' };
	}

	if (executionSlug.includes('gravacao') || executionSlug.includes('retornoapi')) {
		return { chave: 'gravacao', label: 'Gravação' };
	}

	if (executionSlug.includes('comparacao') || executionSlug.includes('leitura')) {
		return { chave: 'extracao', label: 'Extração' };
	}

	return { chave: 'nao_identificado', label: 'Não identificado' };
}

function resolveMotorExecucao(tipoObjeto: unknown, canalExecucao: unknown) {
	const objectSlug = normalizeSlug(tipoObjeto);
	const channelOriginal = toStringValue(canalExecucao);
	const channelSlug = channelOriginal.toLowerCase();

	if (channelSlug === 'agileapi') {
		return { chave: 'api', label: 'API', inferido: false };
	}

	if (channelSlug === 'agilesync') {
		return { chave: 'agilesync', label: 'Agilesync', inferido: false };
	}

	if (channelSlug === 'microservicopython') {
		return { chave: 'api', label: 'Microserviço Python', inferido: false };
	}

	if (channelSlug === 'protheusapi') {
		return { chave: 'api', label: 'Protheus API', inferido: false };
	}

	if (channelSlug) {
		return {
			chave: 'api',
			label: channelOriginal.replace(/[_-]+/g, ' ').replace(/^./, (letter) => letter.toUpperCase()),
			inferido: false,
		};
	}

	if (objectSlug === 'query') {
		return { chave: 'agilesync', label: 'Agilesync', inferido: true };
	}

	if (objectSlug === 'endpoint_gateway') {
		return { chave: 'api', label: 'API', inferido: true };
	}

	if (objectSlug === 'acao') {
		return { chave: 'hibrido', label: 'API ou Agilesync', inferido: true };
	}

	return { chave: 'nao_identificado', label: 'Não identificado', inferido: true };
}

async function resolveTenantContext() {
	const session = await readAuthSession();
	if (!session) {
		return { error: NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 }) };
	}

	const companyResult = await serverApiFetch(`empresas?id=${encodeURIComponent(session.currentTenantId)}&perpage=1`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	});

	if (!companyResult.ok) {
		return {
			error: NextResponse.json({ message: getErrorMessage(companyResult.payload, 'Não foi possível carregar os dados da empresa.') }, { status: companyResult.status || 400 }),
		};
	}

	const company = asRecord(asArray(asRecord(companyResult.payload).data)[0]);
	const companyCode = toStringValue(company.codigo);

	if (!companyCode) {
		return {
			error: NextResponse.json({ message: 'Empresa ativa da aba sem código de integração configurado.' }, { status: 409 }),
		};
	}

	return {
		context: {
			companyCode,
			companyTemplateId: toStringValue(company.id_template),
			userId: session.currentUserId,
			token: session.token,
			currentTenantId: session.currentTenantId,
		} satisfies TenantContext,
	};
}

async function resolveIsMaster(context: TenantContext) {
	const result = await serverApiFetch(`administradores?id=${encodeURIComponent(context.userId)}&perpage=1`, {
		method: 'GET',
		token: context.token,
		tenantId: context.currentTenantId,
	});

	if (!result.ok) {
		return false;
	}

	const user = asRecord(asArray(asRecord(result.payload).data)[0]);
	return toBooleanValue(user.master);
}

async function postExternalJson(target: 'painelb2b' | 'agilesync', path: string, body: unknown) {
	const baseUrl = (target === 'agilesync' ? process.env.ADMIN_URL_API_AGILESYNC : process.env.ADMIN_URL_API_PAINELB2B) || '';
	const token = (target === 'agilesync' ? process.env.ADMIN_API_AGILESYNC_TOKEN || process.env.ADMIN_API_PAINELB2B_TOKEN : process.env.ADMIN_API_PAINELB2B_TOKEN) || '';

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

function buildAgileV2BaseUrl() {
	const explicit = (process.env.ADMIN_URL_API_AGILE || '').trim();
	if (explicit) {
		return explicit.replace(/\/+$/, '');
	}

	const painelb2b = (process.env.ADMIN_URL_API_PAINELB2B || '').trim();
	if (!painelb2b) {
		return '';
	}

	return painelb2b.replace(/\/api\/v1\/?$/i, '/api/v2').replace(/\/+$/, '');
}

async function agileV2ApiFetch(path: string, options: {
	method?: 'GET' | 'POST' | 'DELETE';
	query?: Record<string, string | number | boolean | null | undefined>;
	body?: Record<string, string | number | boolean | null | undefined>;
}) {
	const baseUrl = buildAgileV2BaseUrl();
	const token = (process.env.ADMIN_API_AGILE_TOKEN || process.env.ADMIN_API_PAINELB2B_TOKEN || '').trim();

	if (!baseUrl || !token) {
		return {
			ok: false,
			status: 500,
			payload: { message: 'API Agile v2 não configurada para a operação solicitada.' },
		};
	}

	const method = options.method ?? 'GET';
	const searchParams = new URLSearchParams();
	for (const [key, value] of Object.entries(options.query || {})) {
		if (value === undefined || value === null || value === '') continue;
		searchParams.set(key, String(value));
	}
	const url = `${baseUrl}/${path.replace(/^\/+/, '')}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
	const bodyParams = new URLSearchParams();
	for (const [key, value] of Object.entries(options.body || {})) {
		if (value === undefined || value === null || value === '') continue;
		bodyParams.set(key, String(value));
	}

	try {
		const response = await fetch(url, {
			method,
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`,
				Token: token,
				'X-API-TOKEN': token,
				...(method !== 'GET' ? { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } : {}),
			},
			body: method !== 'GET' ? bodyParams.toString() : undefined,
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
			payload: { message: error instanceof Error ? error.message : 'Falha inesperada ao chamar a API Agile v2.' },
		};
	}
}

async function serverTenantFetch(context: TenantContext, path: string, options?: { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown }) {
	return serverApiFetch(path, {
		method: options?.method ?? 'GET',
		token: context.token,
		tenantId: context.currentTenantId,
		body: options?.body,
	});
}

function buildCaracteristicas(servicoValue: unknown, servicoMetaValue?: unknown) {
	const servico = asRecord(servicoValue);
	const servicoBase = {
		...servico,
		...asRecord(servico.servico),
	};
	const metaServico = asRecord(servicoMetaValue);

	const tipoObjeto = toStringValue(servicoBase.tipo_objeto || metaServico.tipo_objeto);
	const tipoExecucao = toStringValue(servicoBase.tipo_execucao || metaServico.tipo_execucao);
	const nomeObjeto = toStringValue(servicoBase.nome_objeto || metaServico.nome_objeto);
	const canalExecucao = toStringValue(metaServico.canal_execucao);
	const natureza = resolveNatureza(tipoObjeto, tipoExecucao);
	const motorExecucao = resolveMotorExecucao(tipoObjeto, canalExecucao);

	return {
		natureza,
		motor_execucao: motorExecucao,
		tipo_servico: {
			chave: normalizeSlug(tipoObjeto),
			label: formatTipoObjetoLabel(tipoObjeto),
		},
		modo_execucao: {
			chave: normalizeSlug(tipoExecucao),
			label: formatTipoExecucaoLabel(tipoExecucao),
		},
		objeto: {
			chave: normalizeSlug(nomeObjeto),
			label: nomeObjeto || 'Não informado',
		},
	};
}

function normalizeOrderBy(value: string) {
	const allowed = new Set(['id_servico', 'servico.nome', 'intervalo_execucao', 'dthr_ultima_execucao', 'dthr_proxima_execucao', 'status']);

	return allowed.has(value) ? value : 'dthr_proxima_execucao';
}

function normalizeIds(value: unknown) {
	return (Array.isArray(value) ? value : [value]).map((entry) => toStringValue(entry)).filter(Boolean);
}

function buildExecutionStatusLabel(status: string) {
	const normalized = status.toLowerCase();
	if (normalized === 'finalizado') return 'Finalizado';
	if (normalized === 'finalizado_parcial') return 'Finalizado Parcial';
	if (normalized === 'executando_mysql') return 'Em Execução';
	if (normalized === 'falha_na_execucao') return 'Falha';
	if (normalized === 'abortado') return 'Abortado';
	if (normalized === 'suspenso') return 'Suspenso';
	if (normalized === 'registrado') return 'Registrado';
	if (normalized === 'encaminhado') return 'Encaminhado';
	if (normalized === 'enviado') return 'Enviado';
	if (normalized === 'recebido_no_servico') return 'Recebido no Serviço';
	if (normalized === 'desconectado') return 'Desconectado';
	if (normalized === 'devolvido') return 'Devolvido';
	return status || '-';
}

function formatDurationFromSeconds(value: unknown) {
	const totalSeconds = Number(value ?? 0);
	if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
		return '';
	}

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);
	return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function normalizeWizardQueryContextItems(rows: unknown[], kind: 'field' | 'parameter') {
	return rows.map((entry) => {
		const row = asRecord(entry);
		const id = toStringValue(row.id || row.nome || row.label);
		const label = toStringValue(row.nome || row.label || row.text || row.id);
		const dataType = toStringValue(row.tipo);
		const defaultValue = toStringValue(row.valor_padrao || row.default || row.valor);
		const description = [
			toStringValue(row.descricao || row.description),
			dataType,
			defaultValue ? `default(${defaultValue})` : '',
		].filter(Boolean).join(' | ');

		return {
			id,
			label: label || id,
			description,
			kind,
			required: toBooleanValue(row.obrigatorio),
			primaryKey: toBooleanValue(row.chave_primaria),
			dataType,
			defaultValue,
		};
	}).filter((entry) => entry.id);
}

export async function GET(request: NextRequest) {
	const tenantResult = await resolveTenantContext();
	if ('error' in tenantResult) {
		return tenantResult.error;
	}

	const { context } = tenantResult;
	const search = request.nextUrl.searchParams;
	const mode = toStringValue(search.get('mode')).toLowerCase();

	if (mode === 'wizard-context') {
		const isMaster = await resolveIsMaster(context);
		const templatesResult = isMaster
			? await agileV2ApiFetch('templates', {
				method: 'GET',
				query: { perpage: 10000, order: 'nome', sort: 'asc' },
			})
			: null;

		const templates = templatesResult?.ok
			? asArray(asRecord(templatesResult.payload).data).map((entry) => {
				const row = asRecord(entry);
				return {
					id: toStringValue(row.id),
					nome: toStringValue(row.nome),
				};
			}).filter((entry) => entry.id)
			: [];
		const fallbackTemplateName = context.companyTemplateId
			? `Template #${context.companyTemplateId}`
			: '';
		const normalizedTemplates = context.companyTemplateId && !templates.some((entry) => entry.id === context.companyTemplateId)
			? [{ id: context.companyTemplateId, nome: fallbackTemplateName }, ...templates]
			: templates;

		return NextResponse.json({
			data: {
				id_empresa: context.companyCode,
				contexto: isMaster ? 'agile' : 'empresa',
				is_master: isMaster,
				id_template_fixo: context.companyTemplateId,
				nome_template_fixo: normalizedTemplates.find((entry) => entry.id === context.companyTemplateId)?.nome || fallbackTemplateName,
				templates: normalizedTemplates,
			},
		});
	}

	if (mode === 'wizard-catalog') {
		const fallbackTemplateId = context.companyTemplateId;
		const requestedTemplateId = toStringValue(search.get('templateId'));
		const templateId = requestedTemplateId || fallbackTemplateId;

		if (!templateId) {
			return NextResponse.json({ message: 'Template do wizard não identificado.' }, { status: 409 });
		}

		const [querysResult, tabelasResult] = await Promise.all([
			agileV2ApiFetch('querys', {
				method: 'GET',
				query: { perpage: 1000, id_template: templateId, order: 'nome', sort: 'asc' },
			}),
			serverTenantFetch(context, 'dicionarios_tabelas?perpage=1000&order=nome&sort=asc'),
		]);

		if (!querysResult.ok) {
			return NextResponse.json(
				{ message: getErrorMessage(querysResult.payload, 'Não foi possível carregar as queries do wizard.') },
				{ status: querysResult.status || 400 },
			);
		}

		if (!tabelasResult.ok) {
			return NextResponse.json(
				{ message: getErrorMessage(tabelasResult.payload, 'Não foi possível carregar as tabelas de destino do wizard.') },
				{ status: tabelasResult.status || 400 },
			);
		}

		return NextResponse.json({
			data: {
				tipo_objeto: 'query',
				catalogo: {
					querys: asArray(asRecord(querysResult.payload).data).map((entry) => {
						const row = asRecord(entry);
						return {
							id: toStringValue(row.id),
							nome: toStringValue(row.nome),
						};
					}).filter((entry) => entry.id),
					tabelas: asArray(asRecord(tabelasResult.payload).data).map((entry) => {
						const row = asRecord(entry);
						return {
							id: toStringValue(row.nome || row.id),
							nome: toStringValue(row.nome),
							descricao: toStringValue(row.descricao),
						};
					}).filter((entry) => entry.id),
				},
			},
		});
	}

	if (mode === 'wizard-query-context') {
		const tableName = toStringValue(search.get('tableName'));
		const editorVarsResult = await externalAdminApiFetch('painelb2b', 'agilesync_editorsqlvariaveis', {
			method: 'GET',
			query: {
				id_empresa: context.companyCode,
				id_servico: 0,
				perpage: 100000,
			},
		});

		if (!editorVarsResult.ok) {
			return NextResponse.json(
				{ message: getErrorMessage(editorVarsResult.payload, 'Não foi possível carregar o contexto da query.') },
				{ status: editorVarsResult.status || 400 },
			);
		}

		const editorRows = asArray(asRecord(editorVarsResult.payload).data);
		const parameterRows = editorRows.filter((entry) => toStringValue(asRecord(entry).parentId).toLowerCase() === 'parametro');
		const aliasRows = editorRows.filter((entry) => toStringValue(asRecord(entry).parentId).toLowerCase() === 'alias');
		let mergedFieldRows = aliasRows;

		if (tableName) {
			const tablesResult = await serverTenantFetch(context, 'dicionarios_tabelas?perpage=1000&order=nome&sort=asc');
			if (tablesResult.ok) {
				const table = asArray(asRecord(tablesResult.payload).data)
					.map((entry) => asRecord(entry))
					.find((entry) => toStringValue(entry.nome) === tableName);

				if (table) {
					const tableId = toStringValue(table.id);
					const tableDetailsResult = await serverTenantFetch(
						context,
						`dicionarios_tabelas?id=${encodeURIComponent(tableId)}&embed=campos,componentes.componente&perpage=1`,
					);

					if (tableDetailsResult.ok) {
						const detailRow = asRecord(asArray(asRecord(tableDetailsResult.payload).data)[0]);
						const fieldRows = asArray(detailRow.campos)
							.map((entry) => asRecord(entry))
							.filter((entry) => toStringValue(entry.nome))
							.map((entry) => ({
								id: toStringValue(entry.nome),
								nome: toStringValue(entry.nome),
								tipo: toStringValue(entry.tipo),
								chave_primaria: entry.chave_primaria,
								obrigatorio: !toBooleanValue(entry.permite_nulo),
							}));

						const known = new Set(aliasRows.map((entry) => toStringValue(asRecord(entry).nome).toLowerCase()).filter(Boolean));
						const appended = fieldRows.filter((entry) => !known.has(toStringValue(entry.nome).toLowerCase()));
						mergedFieldRows = [...aliasRows, ...appended];
					}
				}
			}
		}

		return NextResponse.json({
			fields: normalizeWizardQueryContextItems(mergedFieldRows, 'field'),
			parameters: normalizeWizardQueryContextItems(parameterRows, 'parameter'),
		});
	}

	if (mode === 'query-support') {
		const serviceId = toStringValue(search.get('serviceId'));
		if (!serviceId) {
			return NextResponse.json({ message: 'Informe um serviço válido para carregar os apoios da query.' }, { status: 400 });
		}

		const result = await externalAdminApiFetch('painelb2b', 'agilesync_editorsqlvariaveis', {
			method: 'GET',
			query: {
				id_empresa: context.companyCode,
				id_servico: serviceId,
				perpage: '100000',
			},
		});

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar campos e parâmetros da query.') }, { status: result.status || 400 });
		}

		return NextResponse.json(result.payload);
	}

	if (mode === 'query-history') {
		const serviceId = toStringValue(search.get('serviceId'));
		if (!serviceId) {
			return NextResponse.json({ message: 'Informe um serviço válido para consultar o histórico.' }, { status: 400 });
		}

		const result = await externalAdminApiFetch('painelb2b', 'servico_empresa_historico', {
			method: 'GET',
			query: {
				id_empresa: context.companyCode,
				id_servico: serviceId,
				page: '1',
				perpage: '20',
			},
		});

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar o histórico da query.') }, { status: result.status || 400 });
		}

		return NextResponse.json(result.payload);
	}

	if (mode === 'config-history') {
		const serviceId = toStringValue(search.get('serviceId'));
		if (!serviceId) {
			return NextResponse.json({ message: 'Informe um serviço válido para consultar os logs da configuração.' }, { status: 400 });
		}

		const serviceResult = await externalAdminApiFetch('painelb2b', 'servico_empresa', {
			method: 'GET',
			query: {
				id_empresa: context.companyCode,
				id_servico: serviceId,
				convertida: 'false',
			},
		});

		if (!serviceResult.ok) {
			return NextResponse.json(
				{ message: getErrorMessage(serviceResult.payload, 'Não foi possível localizar a configuração do serviço.') },
				{ status: serviceResult.status || 400 },
			);
		}

		const service = asRecord(asArray(asRecord(serviceResult.payload).data)[0]);
		const serviceCompanyId = toStringValue(service.id_servico_empresa || service.id);
		if (!serviceCompanyId) {
			return NextResponse.json({ data: [], meta: { total: 0, from: 0, to: 0, page: 1, pages: 1, perpage: 20 } });
		}

		const page = Math.max(1, Number(search.get('page') || 1));
		const perPage = Math.min(100, Math.max(1, Number(search.get('perPage') || 20)));
		const result = await externalAdminApiFetch('agilesync', 'servicos_empresas_logs', {
			method: 'GET',
			query: {
				page: String(page),
				perpage: String(perPage),
				id_empresa: context.companyCode,
				id_servico_empresa: serviceCompanyId,
				order: 'data_hora',
				sort: 'desc',
			},
		});

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar os logs de configuração.') }, { status: result.status || 400 });
		}

		return NextResponse.json(result.payload);
	}

	if (mode === 'detail') {
		const serviceId = toStringValue(search.get('serviceId'));
		if (!serviceId) {
			return NextResponse.json({ message: 'Informe um serviço válido para carregar os detalhes.' }, { status: 400 });
		}

		const result = await externalAdminApiFetch('painelb2b', 'servico_empresa', {
			method: 'GET',
			query: {
				id_empresa: context.companyCode,
				id_servico: serviceId,
				convertida: 'false',
			},
		});

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar os detalhes do serviço.') }, { status: result.status || 400 });
		}

		const service = asRecord(asArray(asRecord(result.payload).data)[0]);
		if (!Object.keys(service).length) {
			return NextResponse.json({ message: 'Serviço ERP não encontrado.' }, { status: 404 });
		}

		const summaryResult = await externalAdminApiFetch('painelb2b', 'servicos_empresas', {
			method: 'GET',
			query: {
				id_empresa: context.companyCode,
				id_servico: serviceId,
				page: '1',
				perpage: '1',
			},
		});
		const summary = summaryResult.ok ? asRecord(asArray(asRecord(summaryResult.payload).data)[0]) : {};
		const enrichedService = {
			...summary,
			...service,
			servico: {
				...summary,
				...asRecord(service.servico),
			},
			caracteristicas: buildCaracteristicas({ ...summary, ...service }, summary),
		};

		return NextResponse.json({
			data: [enrichedService],
			meta: {
				total: 1,
				from: 1,
				to: 1,
				page: 1,
				pages: 1,
				perpage: 1,
			},
		});
	}

	if (mode === 'executions') {
		const serviceId = toStringValue(search.get('serviceId'));
		if (!serviceId) {
			return NextResponse.json({ message: 'Informe um serviço válido para consultar as execuções.' }, { status: 400 });
		}

		const page = Math.max(1, Number(search.get('page') || 1));
		const perPage = Math.min(100, Math.max(1, Number(search.get('perPage') || 10)));
		const query = new URLSearchParams({
			id_empresa: context.companyCode,
			id_servico: serviceId,
			page: String(page),
			perpage: String(perPage),
		});

		const executionId = toStringValue(search.get('executionId'));
		const status = toStringValue(search.get('status'));
		const abortar = toStringValue(search.get('abortar'));

		if (executionId) query.set('id', executionId);
		if (status) query.set('status', status);
		if (abortar) query.set('abortar', abortar);

		const result = await externalAdminApiFetch('painelb2b', 'servico_execucoes', {
			method: 'GET',
			query,
		});

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar as execuções do serviço.') }, { status: result.status || 400 });
		}

		const payload = asRecord(result.payload);
		const rows = asArray(payload.data).map((entry) => {
			const row = asRecord(entry);
			const rawStatus = toStringValue(row.status);
			return {
				...row,
				dthr_inicio: toStringValue(row.dthr_inicio),
				dthr_fim: toStringValue(row.dthr_fim),
				tempo_execucao: row.dthr_fim ? formatDurationFromSeconds(row.tempo_execucao) : '',
				abortar: toBooleanValue(row.abortar) ? 'Sim' : 'Não',
				status: rawStatus,
				status_label: buildExecutionStatusLabel(rawStatus),
				status_log: toStringValue(row.status_log) || '0/0',
			};
		});

		return NextResponse.json({ data: rows, meta: asRecord(payload.meta) });
	}

	if (mode === 'execution-failure') {
		const executionId = toStringValue(search.get('executionId'));
		if (!executionId) {
			return NextResponse.json({ message: 'Informe uma execução válida para consultar a falha.' }, { status: 400 });
		}

		const detalhesResult = await externalAdminApiFetch('painelb2b', 'servico_execucao_detalhes', {
			method: 'GET',
			query: {
				id_empresa: context.companyCode,
				id_servico_execucao: executionId,
				page: '1',
				perpage: '200',
			},
		});

		if (!detalhesResult.ok) {
			return NextResponse.json({ message: getErrorMessage(detalhesResult.payload, 'Não foi possível carregar os detalhes da falha.') }, { status: detalhesResult.status || 400 });
		}

		const detalhes = asArray(asRecord(detalhesResult.payload).data).map(asRecord);
		const detalheFalha =
			detalhes.find((entry) => toStringValue(entry.status) === 'falha_na_execucao') ?? detalhes.find((entry) => toStringValue(entry.metadata)) ?? detalhes.at(-1) ?? {};

		let mensagem = '';
		const detalheId = toStringValue(asRecord(detalheFalha).id);
		if (detalheId) {
			const metadataResult = await externalAdminApiFetch('painelb2b', 'servico_execucao_detalhe_download', {
				method: 'GET',
				query: {
					id_servico_execucao_detalhe: detalheId,
					metadata: '1',
				},
			});

			if (typeof metadataResult.payload === 'string') {
				mensagem = metadataResult.payload.trim();
			}
		}

		if (!mensagem) {
			mensagem = toStringValue(asRecord(detalheFalha).metadata) || 'Não foi possível localizar detalhes da falha para esta execução.';
		}

		const tipoDetalhe = toStringValue(asRecord(detalheFalha).tipo_detalhe);
		const detalheNome = toStringValue(asRecord(detalheFalha).detalhe);
		const etapa = [tipoDetalhe, detalheNome].filter(Boolean).join(' - ');

		return NextResponse.json({
			data: {
				id_servico_execucao: executionId,
				etapa: etapa || '-',
				mensagem,
			},
		});
	}

	if (mode === 'execution-details') {
		const executionId = toStringValue(search.get('executionId'));
		if (!executionId) {
			return NextResponse.json({ message: 'Informe uma execução válida para consultar os detalhes.' }, { status: 400 });
		}

		const page = Math.max(1, Number(search.get('page') || 1));
		const perPage = Math.min(200, Math.max(1, Number(search.get('perPage') || 200)));

		const result = await externalAdminApiFetch('painelb2b', 'servico_execucao_detalhes', {
			method: 'GET',
			query: {
				id_empresa: context.companyCode,
				id_servico_execucao: executionId,
				page: String(page),
				perpage: String(perPage),
			},
		});

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar os detalhes da execução.') }, { status: result.status || 400 });
		}

		return NextResponse.json(result.payload);
	}

	if (mode === 'execution-detail-content') {
		const detailId = toStringValue(search.get('detailId'));
		const kind = toStringValue(search.get('kind')) === 'metadata' ? 'metadata' : 'detail';
		if (!detailId) {
			return NextResponse.json({ message: 'Informe um detalhe válido para consultar o conteúdo.' }, { status: 400 });
		}

		const result = await externalAdminApiFetch('painelb2b', 'servico_execucao_detalhe_download', {
			method: 'GET',
			query: {
				id_servico_execucao_detalhe: detailId,
				metadata: kind === 'metadata' ? '1' : '0',
			},
		});

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar o conteúdo do detalhe da execução.') }, { status: result.status || 400 });
		}

		const content = typeof result.payload === 'string' ? result.payload : JSON.stringify(result.payload, null, 2);

		return NextResponse.json({
			data: {
				title: kind === 'metadata' ? 'Motivo da falha' : 'Conteúdo da execução',
				content: content || '-',
				kind,
			},
		});
	}

	const page = Math.max(1, Number(search.get('page') || 1));
	const perPage = Math.min(100, Math.max(1, Number(search.get('perPage') || 15)));
	const orderBy = normalizeOrderBy(toStringValue(search.get('orderBy')));
	const sort = search.get('sort') === 'desc' ? 'desc' : 'asc';
	const scope = search.get('scope') === 'inactive' ? 'inactive' : 'active';

	const query = new URLSearchParams({
		id_empresa: context.companyCode,
		page: String(page),
		perpage: String(perPage),
		ativo: scope === 'inactive' ? '0' : '1',
		field: orderBy,
		sort,
	});

	const id = toStringValue(search.get('id'));
	const nome = toStringValue(search.get('nome'));
	const intervalo = toStringValue(search.get('intervalo'));
	const status = toStringValue(search.get('status'));

	if (id) {
		query.set('id_servico', id);
	}

	if (nome) {
		query.set('servico.nome:lk', nome);
	}

	if (intervalo) {
		query.set('intervalo_execucao', intervalo);
	}

	if (status) {
		query.set('status', status);
	}

	const result = await externalAdminApiFetch('painelb2b', 'servicos_empresas', {
		method: 'GET',
		query,
	});

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar os serviços ERP.') }, { status: result.status || 400 });
	}

	const payload = asRecord(result.payload);
	const data = asArray(payload.data);
	const enrichedData = data.map((row) => ({
		...asRecord(row),
		caracteristicas: buildCaracteristicas(row),
	}));

	return NextResponse.json({
		data: enrichedData,
		meta: asRecord(payload.meta),
	});
}

export async function POST(request: NextRequest) {
	const tenantResult = await resolveTenantContext();
	if ('error' in tenantResult) {
		return tenantResult.error;
	}

	const { context } = tenantResult;
	const body = await request.json().catch(() => ({}));
	const action = toStringValue(asRecord(body).action).toLowerCase();

	if (action === 'create-wizard') {
		const payload = asRecord(asRecord(body).payload);
		const tipoObjeto = toStringValue(payload.tipoObjeto || payload.tipo_objeto) || 'query';
		const escopo = toStringValue(payload.escopo).toLowerCase() === 'especifico' ? 'especifico' : 'compartilhado';
		const isMaster = await resolveIsMaster(context);
		const templateId = isMaster
			? toStringValue(payload.idTemplate || payload.id_template) || context.companyTemplateId
			: context.companyTemplateId;
		const nomeServico = toStringValue(payload.nomeServico || payload.nome_servico);
		const nomeObjeto = toStringValue(payload.nomeObjeto || payload.nome_objeto);
		const intervaloExecucao = Math.max(1, Number(payload.intervaloExecucao || payload.intervalo_execucao || 10));
		const obrigatorio = toBooleanValue(payload.obrigatorio);
		const auxiliar = asRecord(payload.auxiliar);
		const auxiliarModo = toStringValue(auxiliar.modo) === 'existente' ? 'existente' : 'novo';

		if (!templateId) {
			return NextResponse.json({ message: 'Template do wizard não identificado.' }, { status: 409 });
		}

		if (tipoObjeto !== 'query') {
			return NextResponse.json({ message: 'A primeira versão do wizard suporta apenas serviços do tipo Query.' }, { status: 400 });
		}

		if (!nomeServico || !nomeObjeto) {
			return NextResponse.json({ message: 'Informe o nome do serviço e a tabela de destino para continuar.' }, { status: 400 });
		}

		let idObjetoServico = '';
		const created: Record<string, { id: string } | null> = {
			query: null,
			servico: null,
			servico_empresa: null,
		};

		if (auxiliarModo === 'existente') {
			idObjetoServico = toStringValue(auxiliar.id);
			if (!idObjetoServico) {
				return NextResponse.json({ message: 'Selecione uma query existente válida.' }, { status: 400 });
			}
		} else {
			const queryName = toStringValue(auxiliar.nome);
			const querySql = toStringValue(auxiliar.query);
			if (!queryName || !querySql) {
				return NextResponse.json({ message: 'Informe o nome e o SQL da nova query.' }, { status: 400 });
			}

			const queryResult = await agileV2ApiFetch('querys', {
				method: 'POST',
				body: {
					id: 0,
					nome: queryName,
					query: querySql,
					id_template: Number(templateId),
					observacao: '',
					hash: createHash('md5').update(querySql).digest('hex'),
					data_hora: new Date().toISOString().slice(0, 19).replace('T', ' '),
					ativo: true,
					id_usuario: context.userId,
				},
			});

			if (!queryResult.ok) {
				return NextResponse.json(
					{ message: getErrorMessage(queryResult.payload, 'Não foi possível criar a query do serviço.') },
					{ status: queryResult.status || 400 },
				);
			}

			idObjetoServico = toStringValue(asRecord(queryResult.payload).id || asRecord(asArray(asRecord(queryResult.payload).data)[0]).id);
			if (!idObjetoServico) {
				return NextResponse.json({ message: 'A API não retornou o ID da query criada.' }, { status: 400 });
			}
			created.query = { id: idObjetoServico };
		}

		const servicoResult = await agileV2ApiFetch('servicos', {
			method: 'POST',
			body: {
				nome: nomeServico,
				id_template: Number(templateId),
				tipo_objeto: 'query',
				id_objeto: Number(idObjetoServico),
				nome_objeto: nomeObjeto,
				saida_objeto: 'InsertOnDuplicateUpdate',
				filtro_sql: '',
				tipo_execucao: 'comparacao',
				canal_execucao: 'agilesync',
				fonte_dados: 'agileecommerce',
				intervalo_execucao: intervaloExecucao,
				compara_delecao: false,
				carga_geral: false,
				utiliza_sync_id: false,
				ativo: true,
				obrigatorio,
				especifico: escopo === 'especifico',
			},
		});

		if (!servicoResult.ok) {
			if (created.query?.id) {
				await agileV2ApiFetch(`querys/${encodeURIComponent(created.query.id)}`, { method: 'DELETE' });
			}
			return NextResponse.json(
				{ message: getErrorMessage(servicoResult.payload, 'Não foi possível criar o serviço.') },
				{ status: servicoResult.status || 400 },
			);
		}

		const idServico = toStringValue(asRecord(servicoResult.payload).id || asRecord(asArray(asRecord(servicoResult.payload).data)[0]).id);
		if (!idServico) {
			return NextResponse.json({ message: 'A API não retornou o ID do serviço criado.' }, { status: 400 });
		}
		created.servico = { id: idServico };

		const servicoEmpresaResult = await agileV2ApiFetch('servicos_empresas', {
			method: 'POST',
			body: {
				id_servico: Number(idServico),
				id_empresa: Number(context.companyCode),
				intervalo_execucao: intervaloExecucao,
				ativo: true,
			},
		});

		if (!servicoEmpresaResult.ok) {
			await agileV2ApiFetch(`servicos/${encodeURIComponent(idServico)}`, { method: 'DELETE' });
			if (created.query?.id) {
				await agileV2ApiFetch(`querys/${encodeURIComponent(created.query.id)}`, { method: 'DELETE' });
			}
			return NextResponse.json(
				{ message: getErrorMessage(servicoEmpresaResult.payload, 'Não foi possível criar o vínculo do serviço com a empresa.') },
				{ status: servicoEmpresaResult.status || 400 },
			);
		}

		const idServicoEmpresa = toStringValue(asRecord(servicoEmpresaResult.payload).id || asRecord(asArray(asRecord(servicoEmpresaResult.payload).data)[0]).id);
		created.servico_empresa = idServicoEmpresa ? { id: idServicoEmpresa } : null;

		return NextResponse.json({
			idServico,
			resumoIds: created,
			message: 'Serviço criado com sucesso.',
		});
	}

	if (action === 'execute' || action === 'reload') {
		const ids = normalizeIds(asRecord(body).ids);
		if (!ids.length) {
			return NextResponse.json({ message: 'Selecione ao menos um serviço para continuar.' }, { status: 400 });
		}

		if (action === 'reload' && !(await resolveIsMaster(context))) {
			return NextResponse.json({ message: 'Atenção! Você não tem acesso ao recurso solicitado.' }, { status: 403 });
		}

		const result = await postExternalJson(
			'painelb2b',
			'servicos_executar',
			ids.map((id) => ({
				id_empresa: context.companyCode,
				id_servico: id,
				carga_geral: action === 'reload' ? 1 : 0,
			})),
		);

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível enviar o comando ao integrador.') }, { status: result.status || 400 });
		}

		return NextResponse.json({
			success: true,
			message: 'Comando enviado ao integrador com sucesso.',
		});
	}

	if (action === 'activate') {
		if (!(await resolveIsMaster(context))) {
			return NextResponse.json({ message: 'Atenção! Você não tem acesso ao recurso solicitado.' }, { status: 403 });
		}

		const serviceId = toStringValue(asRecord(body).id);
		if (!serviceId) {
			return NextResponse.json({ message: 'Informe um serviço válido para ativação.' }, { status: 400 });
		}

		const serviceResult = await externalAdminApiFetch('painelb2b', 'servico_empresa', {
			method: 'GET',
			query: {
				id_empresa: context.companyCode,
				id_servico: serviceId,
				convertida: 'false',
			},
		});

		if (!serviceResult.ok) {
			return NextResponse.json(
				{ message: getErrorMessage(serviceResult.payload, 'Não foi possível localizar a configuração do serviço para ativação.') },
				{ status: serviceResult.status || 400 },
			);
		}

		const service = asRecord(asArray(asRecord(serviceResult.payload).data)[0]);
		if (!Object.keys(service).length) {
			return NextResponse.json({ message: 'Não foi possível localizar a configuração do serviço para ativação.' }, { status: 404 });
		}

		const saveResult = await postExternalJson('painelb2b', 'servico_empresa_configuracao', {
			id_empresa: context.companyCode,
			id_servico: serviceId,
			ativo: 1,
			intervalo_execucao: toStringValue(service.intervalo_execucao),
			url_filtro: decodeAmpEntities(toStringValue(service.url_filtro)),
			motivo: toStringValue(asRecord(body).reason) || 'Ativação realizada pela listagem de serviços.',
			id_usuario: context.userId,
		});

		if (!saveResult.ok) {
			return NextResponse.json({ message: getErrorMessage(saveResult.payload, 'Não foi possível ativar o serviço.') }, { status: saveResult.status || 400 });
		}

		return NextResponse.json({
			success: true,
			message: 'Serviço ativado com sucesso.',
		});
	}

	if (action === 'update') {
		if (!(await resolveIsMaster(context))) {
			return NextResponse.json({ message: 'Atenção! Você não tem acesso ao recurso solicitado.' }, { status: 403 });
		}

		const serviceId = toStringValue(asRecord(body).id);
		if (!serviceId) {
			return NextResponse.json({ message: 'Informe um serviço válido para edição.' }, { status: 400 });
		}

		const serviceResult = await externalAdminApiFetch('painelb2b', 'servico_empresa', {
			method: 'GET',
			query: {
				id_empresa: context.companyCode,
				id_servico: serviceId,
				convertida: 'false',
			},
		});

		if (!serviceResult.ok) {
			return NextResponse.json(
				{ message: getErrorMessage(serviceResult.payload, 'Não foi possível localizar a configuração do serviço para edição.') },
				{ status: serviceResult.status || 400 },
			);
		}

		const service = asRecord(asArray(asRecord(serviceResult.payload).data)[0]);
		if (!Object.keys(service).length) {
			return NextResponse.json({ message: 'Não foi possível localizar a configuração do serviço para edição.' }, { status: 404 });
		}

		const saveResult = await postExternalJson('painelb2b', 'servico_empresa_configuracao', {
			id_empresa: context.companyCode,
			id_servico: serviceId,
			ativo: toBooleanValue(asRecord(body).ativo) ? 1 : 0,
			intervalo_execucao: toStringValue(asRecord(body).intervaloExecucao) || toStringValue(service.intervalo_execucao),
			url_filtro: decodeAmpEntities(toStringValue(asRecord(body).urlFiltro) || toStringValue(service.url_filtro)),
			motivo: toStringValue(asRecord(body).motivo) || 'Atualização realizada pela tela de edição de serviços.',
			id_usuario: context.userId,
		});

		if (!saveResult.ok) {
			return NextResponse.json({ message: getErrorMessage(saveResult.payload, 'Não foi possível salvar a configuração do serviço.') }, { status: saveResult.status || 400 });
		}

		return NextResponse.json({
			success: true,
			message: 'Configuração do serviço salva com sucesso.',
		});
	}

	if (action === 'save-query') {
		const serviceId = toStringValue(asRecord(body).id);
		const hash = toStringValue(asRecord(body).hash);
		const sql = toStringValue(asRecord(body).sql);
		const motivo = toStringValue(asRecord(body).motivo);

		if (!serviceId || !hash || !sql || !motivo) {
			return NextResponse.json({ message: 'Informe serviço, hash, SQL e motivo para salvar a query.' }, { status: 400 });
		}

		const result = await postExternalJson('painelb2b', 'servico_empresa', {
			id_empresa: context.companyCode,
			id_usuario: context.userId,
			id_servico: serviceId,
			hash,
			sql,
			motivo,
		});

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível salvar a query do serviço.') }, { status: result.status || 400 });
		}

		return NextResponse.json({ success: true, message: 'Query do serviço salva com sucesso.' });
	}

	if (action === 'rollback-query') {
		const historyId = toStringValue(asRecord(body).historyId);
		if (!historyId) {
			return NextResponse.json({ message: 'Informe um item de histórico válido.' }, { status: 400 });
		}

		const result = await externalAdminApiFetch('painelb2b', 'servico_historico', {
			method: 'GET',
			query: { id: historyId },
		});

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar a versão selecionada.') }, { status: result.status || 400 });
		}

		const sql = toStringValue(asRecord(asArray(asRecord(result.payload).data)[0]).query);
		return NextResponse.json({ sql });
	}

	if (action === 'abort-execution') {
		const executionId = toStringValue(asRecord(body).executionId);
		if (!executionId) {
			return NextResponse.json({ message: 'Informe uma execução válida para abortar.' }, { status: 400 });
		}

		const result = await postExternalJson('agilesync', 'servicos_execucoes', {
			id: Number(executionId),
			id_empresa: Number(context.companyCode),
			abortar: true,
		});

		if (!result.ok) {
			return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível solicitar o abortamento da execução.') }, { status: result.status || 400 });
		}

		return NextResponse.json({ success: true, message: 'Execução sinalizada para abortamento com sucesso.' });
	}

	return NextResponse.json({ message: 'Ação inválida para serviços ERP.' }, { status: 400 });
}
