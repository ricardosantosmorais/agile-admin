import { describe, expect, it } from 'vitest';
import { sanitizeRichHtml } from '@/src/lib/html-sanitizer';

describe('sanitizeRichHtml', () => {
	it('removes dangerous scripts and handlers', () => {
		const result = sanitizeRichHtml('<p onclick="alert(1)">Oi</p><script>alert(1)</script>');

		expect(result).toContain('<p>Oi</p>');
		expect(result).not.toContain('onclick');
		expect(result).not.toContain('<script>');
	});

	it('keeps safe images and removes javascript urls', () => {
		const safeImage = sanitizeRichHtml('<img src="https://cdn.test/imagem.png" onerror="alert(1)">');
		const unsafeImage = sanitizeRichHtml('<img src="javascript:alert(1)">');

		expect(safeImage).toContain('https://cdn.test/imagem.png');
		expect(safeImage).not.toContain('onerror');
		expect(unsafeImage).toBe('');
	});

	it('allows trusted embeds only when explicitly requested', () => {
		const allowed = sanitizeRichHtml('<iframe src="https://www.youtube.com/embed/abc"></iframe>', { allowEmbeds: true });
		const blocked = sanitizeRichHtml('<iframe src="https://evil.test/embed/abc"></iframe>', { allowEmbeds: true });

		expect(allowed).toContain('youtube.com/embed/abc');
		expect(blocked).toBe('');
	});
});
