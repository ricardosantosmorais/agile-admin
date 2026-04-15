import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { asArray, asNumber, asRecord, asString } from '@/src/lib/api-payload';
import { sanitizeRichHtml } from '@/src/lib/html-sanitizer';
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

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const { id } = await context.params;

	try {
		const payload = await intercomFetch<Record<string, unknown>>(`conversations/${encodeURIComponent(id)}`);
		const source = asRecord(payload.source);
		const parts = asArray<Record<string, unknown>>(asRecord(payload.conversation_parts).conversation_parts);
		const timeline = [
			{
				id: `source-${asString(payload.id)}`,
				authorName: asString(asRecord(source.author).name) || asString(asRecord(source.author).email) || 'Contato',
				authorType: asString(asRecord(source.author).type) || 'contact',
				body: sanitizeRichHtml(source.body),
				createdAt: asNumber(payload.created_at, 0),
				partType: asString(source.delivered_as) || 'source',
			},
			...parts.map((part) => ({
				id: asString(part.id) || `${id}-${asNumber(part.created_at, 0)}`,
				authorName: asString(asRecord(part.author).name) || asString(asRecord(part.author).email) || 'Administrador',
				authorType: asString(asRecord(part.author).type) || 'admin',
				body: sanitizeRichHtml(part.body),
				createdAt: asNumber(part.created_at, 0),
				partType: asString(part.part_type) || 'comment',
			})),
		]
			.filter((entry) => entry.body || entry.createdAt)
			.sort((left, right) => left.createdAt - right.createdAt);

		return NextResponse.json({
			id: asString(payload.id),
			protocolo: asString(payload.id),
			status: asString(payload.state),
			assunto: asString(source.subject),
			dataAbertura: asNumber(payload.created_at, 0),
			dataEncerramento: asNumber(asRecord(payload.statistics).last_close_at, 0),
			timeline,
		});
	} catch (error) {
		return NextResponse.json({ message: getErrorMessage(error, 'Não foi possível carregar o atendimento.') }, { status: error instanceof IntercomApiError ? error.status : 400 });
	}
}
