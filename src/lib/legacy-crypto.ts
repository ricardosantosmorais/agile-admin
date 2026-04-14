import { createCipheriv, createDecipheriv } from 'node:crypto';

const LEGACY_ADMIN_CIPHER = 'aes-128-ctr';
const LEGACY_ADMIN_DEFAULT_IV = '9zvEc@qor%rJkCEz';

function normalizeLegacyEnvValue(value: string | undefined) {
	const normalized = String(value || '').trim();
	if (!normalized) {
		return '';
	}

	if ((normalized.startsWith('"') && normalized.endsWith('"')) || (normalized.startsWith("'") && normalized.endsWith("'"))) {
		return normalized.slice(1, -1).trim();
	}

	return normalized;
}

function toLegacyBuffer(value: string, size: number) {
	const buffer = Buffer.alloc(size);
	Buffer.from(value, 'utf-8').copy(buffer, 0, 0, size);
	return buffer;
}

function getLegacyDecryptKey() {
	return normalizeLegacyEnvValue(process.env.ADMIN_LEGACY_DECRYPT_KEY);
}

function getLegacyDecryptIv() {
	return normalizeLegacyEnvValue(process.env.ADMIN_LEGACY_DECRYPT_IV) || LEGACY_ADMIN_DEFAULT_IV;
}

export function isLatin1ByteString(value: string) {
	for (const char of value) {
		if (char.charCodeAt(0) > 255) {
			return false;
		}
	}

	return true;
}

export function decryptLegacyAdminValue(value: string) {
	const normalized = String(value || '').trim();
	if (!normalized) {
		return '';
	}

	const keySource = getLegacyDecryptKey();
	if (!keySource) {
		throw new Error('Chave de decrypt legado não configurada no ambiente.');
	}

	const key = toLegacyBuffer(keySource, 16);
	const iv = toLegacyBuffer(getLegacyDecryptIv(), 16);
	const decipher = createDecipheriv(LEGACY_ADMIN_CIPHER, key, iv);

	return decipher.update(normalized, 'base64', 'utf8') + decipher.final('utf8');
}

export function encryptLegacyAdminValue(value: string) {
	const keySource = getLegacyDecryptKey();
	if (!keySource) {
		throw new Error('Chave de encrypt legado não configurada no ambiente.');
	}

	const key = toLegacyBuffer(keySource, 16);
	const iv = toLegacyBuffer(getLegacyDecryptIv(), 16);
	const cipher = createCipheriv(LEGACY_ADMIN_CIPHER, key, iv);

	return cipher.update(value, 'utf8', 'base64') + cipher.final('base64');
}
