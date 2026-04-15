import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { asArray, asNumber, asRecord, asString } from '@/src/lib/api-payload';
import { intercomFetch, IntercomApiError } from '@/src/lib/intercom-server';

function getErrorMessage(error: unknown, fallback: string) {
	if (error instanceof IntercomApiError) {
		return error.message;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return fallback;
}

export async function GET(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const searchParams = request.nextUrl.searchParams;
	const page = Math.max(1, Number(searchParams.get('page') || '1'));
	const perPage = Math.max(1, Number(searchParams.get('perPage') || '5'));
	const protocolo = searchParams.get('protocolo')?.trim() ?? '';
	const status = searchParams.get('status')?.trim() ?? '';
	const dataInicio = searchParams.get('dataInicio')?.trim() ?? '';
	const dataFim = searchParams.get('dataFim')?.trim() ?? '';
	const startingAfter = searchParams.get('startingAfter')?.trim() ?? '';

	try {
		const contact = await intercomFetch<{ id?: string }>(`contacts/find_by_external_id/${encodeURIComponent(session.currentUserId)}`);
		const contactId = contact?.id?.trim();

		if (!contactId) {
			return NextResponse.json({
				data: [],
				meta: {
					page,
					pages: 1,
					perPage,
					from: 0,
					to: 0,
					total: 0,
				},
				nextCursor: null,
			});
		}

		const filters: Array<Record<string, unknown>> = [{ field: 'contact_ids', operator: '=', value: contactId }];

		if (protocolo) {
			filters.push({ field: 'id', operator: '=', value: protocolo });
		}
		if (status) {
			filters.push({ field: 'state', operator: '=', value: status });
		}
		if (dataInicio) {
			filters.push({ field: 'created_at', operator: '>=', value: Number(dataInicio) });
		}
		if (dataFim) {
			filters.push({ field: 'created_at', operator: '<=', value: Number(dataFim) });
		}

		const payload = await intercomFetch<Record<string, unknown>>('conversations/search', {
			method: 'POST',
			body: {
				query: {
					operator: 'AND',
					value: filters,
				},
				pagination: {
					per_page: perPage,
					...(startingAfter ? { starting_after: startingAfter } : {}),
				},
			},
		});

		const conversations = asArray<Record<string, unknown>>(payload.conversations);
		const total = asNumber(payload.total_count, 0);
		const nextCursor = asString(asRecord(asRecord(payload.pages).next).starting_after, '') || null;
		const from = conversations.length ? (page - 1) * perPage + 1 : 0;
		const to = conversations.length ? from + conversations.length - 1 : 0;

		return NextResponse.json({
			data: conversations.map((conversation) => ({
				id: asString(conversation.id),
				protocolo: asString(conversation.id),
				data_abertura: asNumber(conversation.created_at, 0),
				data_encerramento: asNumber(asRecord(conversation.statistics).last_close_at, 0),
				status: asString(conversation.state),
			})),
			meta: {
				page,
				pages: Math.max(1, Math.ceil(total / perPage) || 1),
				perPage,
				from,
				to,
				total,
			},
			nextCursor,
		});
	} catch (error) {
		return NextResponse.json({ message: getErrorMessage(error, 'Não foi possível carregar os atendimentos.') }, { status: error instanceof IntercomApiError ? error.status : 400 });
	}
}
