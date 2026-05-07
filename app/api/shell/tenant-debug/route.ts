import { NextResponse } from 'next/server';
import { extractApiErrorMessage, mapAuthSession } from '@/src/features/auth/services/auth-mappers';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { enrichMasterPayload } from '@/src/features/auth/services/auth-server';
import { asArray, asRecord, asString } from '@/src/lib/api-payload';
import { serverApiFetch } from '@/src/services/http/server-api';

const PLATFORM_TOKEN_KEY = 'agileecommerce_api_token_empresa';

export async function GET() {
	const storedSession = await readAuthSession();

	if (!storedSession?.token || !storedSession.currentTenantId) {
		return NextResponse.json({ message: 'Sessão não encontrada.' }, { status: 401 });
	}

	const validated = await serverApiFetch('login/validar', {
		method: 'POST',
		token: storedSession.token,
		tenantId: storedSession.currentTenantId,
	});

	if (!validated.ok) {
		return NextResponse.json(
			{ message: extractApiErrorMessage(validated.payload, 'Sessão inválida.') },
			{ status: 401 },
		);
	}

	const enrichedPayload = await enrichMasterPayload(validated.payload, storedSession.token, storedSession.currentTenantId);
	const session = mapAuthSession(enrichedPayload);

	if (!session.user.master) {
		return NextResponse.json({ message: 'Acesso permitido apenas para usuários master.' }, { status: 403 });
	}

	const platformTokenResponse = await serverApiFetch(
		`empresas/parametros?id_empresa=${encodeURIComponent(storedSession.currentTenantId)}&chave=${PLATFORM_TOKEN_KEY}&order=chave,posicao&perpage=1`,
		{
			method: 'GET',
			token: storedSession.token,
			tenantId: storedSession.currentTenantId,
		},
	);

	if (!platformTokenResponse.ok) {
		return NextResponse.json({ platformToken: '' });
	}

	const platformTokenRows = asArray(asRecord(platformTokenResponse.payload).data);
	const platformToken = asString(asRecord(platformTokenRows[0]).parametros).trim();

	return NextResponse.json({ platformToken });
}
