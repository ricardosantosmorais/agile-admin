type SanitizeHtmlOptions = {
	allowEmbeds?: boolean;
};

function decodeHtmlEntities(value: string) {
	return value
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&amp;/gi, '&');
}

function stripDangerousAttributes(html: string) {
	return html
		.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '')
		.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '')
		.replace(/\s+on[a-z]+\s*=\s*[^\s>]+/gi, '')
		.replace(/\s+style\s*=\s*"[^"]*"/gi, '')
		.replace(/\s+style\s*=\s*'[^']*'/gi, '');
}

function sanitizeAnchor(tag: string) {
	const hrefMatch = tag.match(/\shref\s*=\s*("|')(.*?)\1/i);
	const targetMatch = tag.match(/\starget\s*=\s*("|')(.*?)\1/i);

	let href = hrefMatch?.[2]?.trim() ?? '';
	const target = targetMatch?.[2]?.trim().toLowerCase() ?? '';

	if (/^(javascript|data|vbscript):/i.test(href)) {
		href = '';
	}

	const attrs = [];
	if (href) {
		attrs.push(`href="${href.replace(/"/g, '&quot;')}"`);
	}
	if (target === '_blank' || target === '_self') {
		attrs.push(`target="${target}"`);
		if (target === '_blank') {
			attrs.push('rel="noopener noreferrer"');
		}
	}

	return `<a${attrs.length ? ` ${attrs.join(' ')}` : ''}>`;
}

function sanitizeImage(tag: string) {
	const srcMatch = tag.match(/\ssrc\s*=\s*("|')(.*?)\1/i);
	const altMatch = tag.match(/\salt\s*=\s*("|')(.*?)\1/i);
	const titleMatch = tag.match(/\stitle\s*=\s*("|')(.*?)\1/i);
	const loadingMatch = tag.match(/\sloading\s*=\s*("|')(.*?)\1/i);
	const widthMatch = tag.match(/\swidth\s*=\s*("|')?(\d{1,4})\1?/i);
	const heightMatch = tag.match(/\sheight\s*=\s*("|')?(\d{1,4})\1?/i);

	const src = decodeHtmlEntities(srcMatch?.[2]?.trim() ?? '');
	if (!src || !/^(https?:\/\/|\/|\.\/|\.\.\/|data:image\/)/i.test(src)) {
		return '';
	}

	const attrs = [`src="${src.replace(/"/g, '&quot;')}"`];
	const alt = altMatch?.[2]?.trim() ?? '';
	const title = titleMatch?.[2]?.trim() ?? '';
	const loading = loadingMatch?.[2]?.trim().toLowerCase() ?? '';

	if (alt) {
		attrs.push(`alt="${alt.replace(/"/g, '&quot;')}"`);
	}
	if (title) {
		attrs.push(`title="${title.replace(/"/g, '&quot;')}"`);
	}
	if (widthMatch?.[2]) {
		attrs.push(`width="${widthMatch[2]}"`);
	}
	if (heightMatch?.[2]) {
		attrs.push(`height="${heightMatch[2]}"`);
	}
	if (['lazy', 'eager', 'auto'].includes(loading)) {
		attrs.push(`loading="${loading}"`);
	}

	return `<img ${attrs.join(' ')}>`;
}

function sanitizeIframe(tag: string, allowEmbeds: boolean) {
	if (!allowEmbeds) {
		return '';
	}

	const srcMatch = tag.match(/\ssrc\s*=\s*("|')(.*?)\1/i);
	const src = decodeHtmlEntities(srcMatch?.[2]?.trim() ?? '');
	if (!src || !/(youtube\.com|youtu\.be|player\.vimeo\.com|vimeo\.com)/i.test(src)) {
		return '';
	}

	const titleMatch = tag.match(/\stitle\s*=\s*("|')(.*?)\1/i);
	const title = titleMatch?.[2]?.trim() ?? '';
	const attrs = [`src="${src.replace(/"/g, '&quot;')}"`, 'allowfullscreen', 'loading="lazy"', 'referrerpolicy="strict-origin-when-cross-origin"'];

	if (title) {
		attrs.push(`title="${title.replace(/"/g, '&quot;')}"`);
	}

	return `<iframe ${attrs.join(' ')}></iframe>`;
}

export function sanitizeRichHtml(input: unknown, options: SanitizeHtmlOptions = {}) {
	if (typeof input !== 'string') {
		return '';
	}

	let html = decodeHtmlEntities(input.replace(/\0/g, '').trim());
	if (!html) {
		return '';
	}

	html = html
		.replace(/<(script|style|object|embed|form|input|button|textarea|select|meta|link)[^>]*>[\s\S]*?<\/\1>/gi, '')
		.replace(/<(script|style|object|embed|form|input|button|textarea|select|meta|link)[^>]*\/?>/gi, '');

	html = stripDangerousAttributes(html);
	html = html.replace(/<a\b[^>]*>/gi, (tag) => sanitizeAnchor(tag));
	html = html.replace(/<img\b[^>]*>/gi, (tag) => sanitizeImage(tag));
	html = html.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, (tag) => sanitizeIframe(tag, options.allowEmbeds === true));
	html = html.replace(/<iframe\b[^>]*\/?>/gi, (tag) => sanitizeIframe(tag, options.allowEmbeds === true));

	const hasVisibleText =
		html
			.replace(/<br\s*\/?>/gi, '')
			.replace(/<[^>]+>/g, '')
			.trim().length > 0;
	const hasMedia = /<(img|iframe)\b/i.test(html);

	return hasVisibleText || hasMedia ? html : '';
}
