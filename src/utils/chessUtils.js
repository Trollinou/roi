/**
 * Utilitaires pour la manipulation et la validation de PGN et FEN.
 */

/**
 * Garantit que les entêtes PGN contiennent [SetUp "1"] et [FEN "..."] si un FEN initial personnalisé est défini.
 *
 * @param {string} pgn - Texte PGN source
 * @param {string} fen - Chaîne FEN de position initiale
 * @return {string} PGN mis à jour avec les en-têtes FEN requis
 */
export function ensurePgnFenHeader(pgn, fen) {
	if (!fen || typeof fen !== 'string') {
		return pgn || '';
	}
	const cleanedFen = fen.trim();
	if (
		!cleanedFen ||
		cleanedFen ===
			'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
	) {
		return pgn || '';
	}

	const cleanedPgn = pgn ? pgn.trim() : '';
	if (cleanedPgn.includes('[FEN ')) {
		return cleanedPgn;
	}

	const setupHeaders = `[SetUp "1"]\n[FEN "${cleanedFen}"]\n`;

	if (!cleanedPgn) {
		return setupHeaders;
	}

	if (cleanedPgn.includes(']')) {
		const lastHeaderIndex = cleanedPgn.lastIndexOf(']');
		const headersPart = cleanedPgn.slice(0, lastHeaderIndex + 1);
		const movesPart = cleanedPgn.slice(lastHeaderIndex + 1).trim();
		return `${headersPart}\n${setupHeaders}\n${movesPart}`;
	}

	return `${setupHeaders}\n${cleanedPgn}`;
}

/**
 * Convertit un coup SAN de notation internationale (K, Q, R, B, N)
 * en notation française (R, D, T, F, C).
 *
 * @param {string} san - Coup SAN en notation internationale.
 * @return {string} Coup SAN en notation française.
 */
export function toFrenchNotation(san) {
	if (!san || typeof san !== 'string') {
		return '';
	}
	const pieceMap = {
		K: 'R', // Roi
		Q: 'D', // Dame
		R: 'T', // Tour
		B: 'F', // Fou
		N: 'C', // Cavalier
	};
	return san.replace(/[KQRBN]/g, (match) => pieceMap[match] || match);
}

/**
 * Noms des rôles de pièces en français.
 */
export const ROLE_NAMES_FR = {
	pawn: 'Pion',
	knight: 'Cavalier',
	bishop: 'Fou',
	rook: 'Tour',
	queen: 'Dame',
	king: 'Roi',
	p: 'Pion',
	n: 'Cavalier',
	b: 'Fou',
	r: 'Tour',
	q: 'Dame',
	k: 'Roi',
};

/**
 * Retourne le nom en français d'une pièce à partir de son rôle ou caractère FEN.
 *
 * @param {string} roleOrChar - Clé de rôle (ex: 'n', 'knight', 'q')
 * @return {string} Nom français de la pièce (ex: 'Cavalier', 'Dame')
 */
export function getPieceLabel(roleOrChar) {
	if (!roleOrChar) return 'Pièce';
	const key = String(roleOrChar).toLowerCase();
	return ROLE_NAMES_FR[key] || 'Pièce';
}

/**
 * Palette de correspondance des codes de couleur Lichess vers les noms de brosses.
 */
export const PGN_BRUSH_MAP = {
	g: 'green',
	r: 'red',
	b: 'blue',
	y: 'yellow',
	c: 'green',
	o: 'yellow',
};

/**
 * Extrait les formes graphiques ([%csl ...], [%cal ...], [%cpl ...]) et le texte nettoyé d'un commentaire PGN.
 *
 * @param {string} commentsText - Chaîne de commentaires PGN
 * @return {{ shapes: Array<{ orig: string, dest?: string, brush: string }>, cleanedText: string }}
 */
export function extractShapesFromComments(commentsText) {
	if (!commentsText || typeof commentsText !== 'string') {
		return { shapes: [], cleanedText: '' };
	}
	const shapes = [];

	// 1. Cercles [%csl ...] ou [%cpl ...]
	const cslRegex = /\[%(?:csl|cpl)\s+([^\]]+)\]/gi;
	let cslMatch;
	while ((cslMatch = cslRegex.exec(commentsText)) !== null) {
		const items = cslMatch[1].split(',');
		for (const item of items) {
			const clean = item.trim();
			if (clean.length >= 3) {
				const brushChar = clean[0].toLowerCase();
				const brush = PGN_BRUSH_MAP[brushChar] || 'green';
				const orig = clean.substring(1, 3).toLowerCase();
				if (!shapes.some((s) => s.orig === orig && !s.dest)) {
					shapes.push({ orig, brush });
				}
			}
		}
	}

	// 2. Flèches [%cal ...]
	const calRegex = /\[%cal\s+([^\]]+)\]/gi;
	let calMatch;
	while ((calMatch = calRegex.exec(commentsText)) !== null) {
		const items = calMatch[1].split(',');
		for (const item of items) {
			const clean = item.trim();
			if (clean.length >= 5) {
				const brushChar = clean[0].toLowerCase();
				const brush = PGN_BRUSH_MAP[brushChar] || 'green';
				const orig = clean.substring(1, 3).toLowerCase();
				const dest = clean.substring(3, 5).toLowerCase();
				if (!shapes.some((s) => s.orig === orig && s.dest === dest)) {
					shapes.push({ orig, dest, brush });
				}
			}
		}
	}

	// 3. Texte épuré
	const cleanedText = commentsText
		.replace(/\[%[^\]]+\]/g, '')
		.trim()
		.replace(/\s{2,}/g, ' ');

	return { shapes, cleanedText };
}
