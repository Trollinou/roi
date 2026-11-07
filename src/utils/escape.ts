/**
 * HTML and attribute escaping utilities to prevent XSS.
 */

export function escapeHtml(str?: string | null): string {
	return String(str || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function escapeAttr(str?: string | null): string {
	return escapeHtml(str);
}
