import { NextRequest, NextResponse } from 'next/server';
import { readAuthSession } from '@/src/features/auth/services/auth-session';
import { asArray, asRecord } from '@/src/lib/api-payload';
import { serverApiFetch } from '@/src/services/http/server-api';

function getPayloadMessage(payload: unknown, fallback: string) {
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

export async function GET() {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const [configResult, bindingResult, accountsResult] = await Promise.all([
		serverApiFetch('external-channel-configs?channel_key=intercom', {
			method: 'GET',
			token: session.token,
			tenantId: session.currentTenantId,
		}),
		serverApiFetch(`external-admin-bindings?channel_key=intercom&id_administrador=${encodeURIComponent(session.currentUserId)}`, {
			method: 'GET',
			token: session.token,
			tenantId: session.currentTenantId,
		}),
		serverApiFetch('external-provider-accounts?channel_key=intercom', {
			method: 'GET',
			token: session.token,
			tenantId: session.currentTenantId,
		}),
	]);

	if (!configResult.ok) {
		return NextResponse.json({ message: getPayloadMessage(configResult.payload, 'Não foi possível carregar a configuração do Intercom.') }, { status: configResult.status || 400 });
	}
	if (!bindingResult.ok) {
		return NextResponse.json({ message: getPayloadMessage(bindingResult.payload, 'Não foi possível carregar o vínculo do Intercom.') }, { status: bindingResult.status || 400 });
	}
	if (!accountsResult.ok) {
		return NextResponse.json({ message: getPayloadMessage(accountsResult.payload, 'Não foi possível carregar as contas do Intercom.') }, { status: accountsResult.status || 400 });
	}

	return NextResponse.json({
		config: asArray<Record<string, unknown>>(asRecord(configResult.payload).data)[0] ?? null,
		binding: asArray<Record<string, unknown>>(asRecord(bindingResult.payload).data)[0] ?? null,
		accounts: asArray<Record<string, unknown>>(asRecord(accountsResult.payload).data),
	});
}

export async function POST(request: NextRequest) {
	const session = await readAuthSession();
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 });
	}

	const body = (await request.json()) as {
		configId?: string;
		bindingId?: string;
		enabled?: boolean;
		providerAccountId?: string;
		externalUserId?: string;
		consentState?: string;
		status?: string;
		bindingStatus?: string;
	};

	const configPayload = {
		id: body.configId?.trim() || undefined,
		channel_key: 'intercom',
		provider: 'intercom',
		enabled: body.enabled === true,
		consent_state: body.consentState?.trim() || 'unknown',
		status: body.status?.trim() || 'configured',
		allowed_operations_json: JSON.stringify(['list', 'read', 'reply']),
		policy_json: JSON.stringify({ default_mutation_requires_approval: true }),
	};

	const configResult = await serverApiFetch('external-channel-configs', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: configPayload,
	});

	if (!configResult.ok) {
		return NextResponse.json({ message: getPayloadMessage(configResult.payload, 'Não foi possível salvar a configuração do Intercom.') }, { status: configResult.status || 400 });
	}

	const bindingResult = await serverApiFetch('external-admin-bindings', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: {
			id: body.bindingId?.trim() || undefined,
			channel_key: 'intercom',
			id_administrador: session.currentUserId,
			provider_account_id: body.providerAccountId?.trim() || '',
			external_user_id: body.externalUserId?.trim() || '',
			binding_status: body.bindingStatus?.trim() || 'linked',
		},
	});

	if (!bindingResult.ok) {
		return NextResponse.json({ message: getPayloadMessage(bindingResult.payload, 'Não foi possível salvar o vínculo do Intercom.') }, { status: bindingResult.status || 400 });
	}

	return NextResponse.json({ message: 'Vínculo do Intercom salvo com sucesso.' });
}
