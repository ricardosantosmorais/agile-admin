import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { asArray, asNumber, asRecord, asString } from '@/src/lib/api-payload';
import { sanitizeRichHtml } from '@/src/lib/html-sanitizer';
import { getKnowledgeBaseParentId, intercomFetch, IntercomApiError } from '@/src/lib/intercom-server';

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
	const perPage = Math.max(1, Number(searchParams.get('perPage') || '15'));
	const phrase = searchParams.get('phrase')?.trim() ?? '';

	try {
		const query = new URLSearchParams({
			page: String(page),
			per_page: String(perPage),
			state: 'published',
		});
		if (phrase) {
			query.set('phrase', phrase);
		}

		const payload = await intercomFetch<Record<string, unknown>>(`articles/search?${query.toString()}`);
		const parentId = getKnowledgeBaseParentId();
		const articles = asArray<Record<string, unknown>>(asRecord(payload.data).articles).filter((article) => {
			const title = asString(article.title).trim();
			if (!title || title === 'Artigo público sem título') {
				return false;
			}

			const parentIds = asArray<number>(article.parent_ids);
			return parentIds.includes(parentId);
		});

		const total = asNumber(payload.total_count, articles.length);
		const from = articles.length ? (page - 1) * perPage + 1 : 0;
		const to = articles.length ? from + articles.length - 1 : 0;

		return NextResponse.json({
			data: articles.map((article) => ({
				id: asString(article.id),
				titulo: asString(article.title),
				descricao: asString(article.description),
				dataCriacao: asNumber(article.created_at, 0),
				html: sanitizeRichHtml(article.body, { allowEmbeds: true }),
			})),
			meta: {
				page,
				pages: Math.max(1, Math.ceil(total / perPage) || 1),
				perPage,
				from,
				to,
				total,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{ message: getErrorMessage(error, 'Não foi possível carregar a base de conhecimento.') },
			{ status: error instanceof IntercomApiError ? error.status : 400 },
		);
	}
}
