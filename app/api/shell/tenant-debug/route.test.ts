import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/shell/tenant-debug/route';

const {
	enrichMasterPayloadMock,
	mapAuthSessionMock,
	readAuthSessionMock,
	serverApiFetchMock,
} = vi.hoisted(() => ({
	enrichMasterPayloadMock: vi.fn(),
	mapAuthSessionMock: vi.fn(),
	readAuthSessionMock: vi.fn(),
	serverApiFetchMock: vi.fn(),
}));

vi.mock('@/src/features/auth/services/auth-session', () => ({
	readAuthSession: readAuthSessionMock,
}));

vi.mock('@/src/features/auth/services/auth-server', () => ({
	enrichMasterPayload: enrichMasterPayloadMock,
}));

vi.mock('@/src/features/auth/services/auth-mappers', () => ({
	extractApiErrorMessage: (_payload: unknown, fallback: string) => fallback,
	mapAuthSession: mapAuthSessionMock,
}));

vi.mock('@/src/services/http/server-api', () => ({
	serverApiFetch: serverApiFetchMock,
}));

describe('shell tenant-debug route', () => {
	beforeEach(() => {
		enrichMasterPayloadMock.mockReset();
		mapAuthSessionMock.mockReset();
		readAuthSessionMock.mockReset();
		serverApiFetchMock.mockReset();

		readAuthSessionMock.mockResolvedValue({
			token: 'session-token',
			currentTenantId: 'empresa-1',
		});
		enrichMasterPayloadMock.mockResolvedValue({ ok: true });
		serverApiFetchMock.mockResolvedValueOnce({ ok: true, status: 200, payload: { token: 'valid' } });
	});

	it('denies tenant debug data for non-master users', async () => {
		mapAuthSessionMock.mockReturnValue({
			user: { master: false },
		});

		const response = await GET();

		expect(response.status).toBe(403);
		expect(serverApiFetchMock).toHaveBeenCalledTimes(1);
	});

	it('returns the platform token for master users', async () => {
		mapAuthSessionMock.mockReturnValue({
			user: { master: true },
		});
		serverApiFetchMock.mockResolvedValueOnce({
			ok: true,
			status: 200,
			payload: { data: [{ parametros: 'tenant-token-123' }] },
		});

		const response = await GET();

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ platformToken: 'tenant-token-123' });
		expect(serverApiFetchMock).toHaveBeenLastCalledWith(
			'empresas/parametros?id_empresa=empresa-1&chave=agileecommerce_api_token_empresa&order=chave,posicao&perpage=1',
			expect.objectContaining({
				method: 'GET',
				token: 'session-token',
				tenantId: 'empresa-1',
			}),
		);
	});
});
