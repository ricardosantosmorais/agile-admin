import { afterEach, describe, expect, it } from 'vitest';
import { decryptLegacyAdminValue, encryptLegacyAdminValue, isLatin1ByteString } from '@/src/lib/legacy-crypto';

const LEGACY_KEY = 'P#kL1Vr7UqCY*Kj7ZxVlbiz$FzHh#Y@pZoSShBtxYwfAk@A%Q$';
const LEGACY_IV = '9zvEc@qor%rJkCEz';

const originalKey = process.env.ADMIN_LEGACY_DECRYPT_KEY;
const originalIv = process.env.ADMIN_LEGACY_DECRYPT_IV;

afterEach(() => {
	process.env.ADMIN_LEGACY_DECRYPT_KEY = originalKey;
	process.env.ADMIN_LEGACY_DECRYPT_IV = originalIv;
});

describe('legacy-crypto', () => {
	it('aceita key e iv com aspas no ambiente', () => {
		process.env.ADMIN_LEGACY_DECRYPT_KEY = `"${LEGACY_KEY}"`;
		process.env.ADMIN_LEGACY_DECRYPT_IV = `"${LEGACY_IV}"`;

		const encrypted = encryptLegacyAdminValue('portal-token-valido');

		expect(decryptLegacyAdminValue(encrypted)).toBe('portal-token-valido');
	});

	it('identifica strings inválidas para uso como ByteString em header', () => {
		expect(isLatin1ByteString('token-valido-123')).toBe(true);
		expect(isLatin1ByteString('token\u0670-invalido')).toBe(false);
	});
});
