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
export function ensurePgnFenHeader( pgn, fen ) {
	if ( ! fen || typeof fen !== 'string' ) {
		return pgn || '';
	}
	const cleanedFen = fen.trim();
	if (
		! cleanedFen ||
		cleanedFen ===
			'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
	) {
		return pgn || '';
	}

	const cleanedPgn = pgn ? pgn.trim() : '';
	if ( cleanedPgn.includes( '[FEN ' ) ) {
		return cleanedPgn;
	}

	const setupHeaders = `[SetUp "1"]\n[FEN "${ cleanedFen }"]\n`;

	if ( ! cleanedPgn ) {
		return setupHeaders;
	}

	if ( cleanedPgn.includes( ']' ) ) {
		const lastHeaderIndex = cleanedPgn.lastIndexOf( ']' );
		const headersPart = cleanedPgn.slice( 0, lastHeaderIndex + 1 );
		const movesPart = cleanedPgn.slice( lastHeaderIndex + 1 ).trim();
		return `${ headersPart }\n${ setupHeaders }\n${ movesPart }`;
	}

	return `${ setupHeaders }\n${ cleanedPgn }`;
}
