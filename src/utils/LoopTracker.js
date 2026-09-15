/**
 * Utilitaires pour le suivi de parcours en boucle fermée (Tour complet / Winding Number).
 */

/**
 * Convertit une notation algébrique de case (ex: 'c3') en coordonnées cartésiennes {x: 1..8, y: 1..8}.
 *
 * @param {string} sq - Nom de la case
 * @return {{x: number, y: number}|null} Coordonnées (1-indexed)
 */
export function squareToCoords(sq) {
	if (!sq || typeof sq !== 'string' || sq.length < 2) {
		return null;
	}
	const file = sq[0].toLowerCase();
	const rank = parseInt(sq[1], 10);
	if (file < 'a' || file > 'h' || isNaN(rank) || rank < 1 || rank > 8) {
		return null;
	}
	return {
		x: file.charCodeAt(0) - 'a'.charCodeAt(0) + 1,
		y: rank,
	};
}

/**
 * Extrait la position de la première pièce ennemie trouvée dans un FEN.
 *
 * @param {string}          fen         - FEN de la position
 * @param {'white'|'black'} playerColor - Couleur du joueur
 * @return {string|null} Case de la pièce ennemie (ex: 'd5')
 */
export function extractOpponentPieceSquare(fen, playerColor) {
	if (!fen || typeof fen !== 'string') {
		return null;
	}
	const placement = fen.trim().split(' ')[0];
	const rows = placement.split('/');
	if (rows.length !== 8) {
		return null;
	}

	const isOpponentChar = (ch) => {
		if (playerColor === 'white') {
			return ['k', 'q', 'r', 'b', 'n', 'p'].includes(ch);
		}
		return ['K', 'Q', 'R', 'B', 'N', 'P'].includes(ch);
	};

	for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
		const row = rows[rowIndex];
		const rank = 8 - rowIndex;
		let colIndex = 0;

		for (let i = 0; i < row.length; i++) {
			const ch = row[i];
			if (ch >= '1' && ch <= '8') {
				colIndex += parseInt(ch, 10);
			} else {
				if (isOpponentChar(ch)) {
					const file = String.fromCharCode(
						'a'.charCodeAt(0) + colIndex
					);
					return `${file}${rank}`;
				}
				colIndex++;
			}
		}
	}
	return null;
}

/**
 * Classe gérant le calcul de l'indice d'enroulement (Winding Number) et le passage par les 4 quadrants.
 */
export class LoopTracker {
	/**
	 * @param {string} targetSquare - Case centrale à contourner (ex: 'd5')
	 * @param {string} startSquare  - Case de départ et d'arrivée (ex: 'c3')
	 */
	constructor(targetSquare, startSquare) {
		this.targetSquare = targetSquare.toLowerCase();
		this.startSquare = startSquare.toLowerCase();
		this.targetCoords = squareToCoords(this.targetSquare) || { x: 4, y: 5 };
		this.currentSquare = this.startSquare;
		this.movesCount = 0;
		this.totalAngle = 0; // en radians
		this.lastAngle = this.getAngleFromTarget(this.startSquare);
		this.quadrantsVisited = new Set();

		const initialQuadrant = this.getQuadrant(this.startSquare);
		if (initialQuadrant > 0) {
			this.quadrantsVisited.add(initialQuadrant);
		}
	}

	/**
	 * Calcule l'angle polaire d'une case par rapport à la cible.
	 *
	 * @param {string} sq
	 * @return {number} Angle en radians [-PI, PI]
	 */
	getAngleFromTarget(sq) {
		const coords = squareToCoords(sq);
		if (!coords) {
			return 0;
		}
		const dx = coords.x - this.targetCoords.x;
		const dy = coords.y - this.targetCoords.y;
		return Math.atan2(dy, dx);
	}

	/**
	 * Détermine le quadrant (1: NE, 2: NO, 3: SO, 4: SE) par rapport à la cible.
	 *
	 * @param {string} sq
	 * @return {number} 1, 2, 3, 4 ou 0 si sur la cible
	 */
	getQuadrant(sq) {
		const coords = squareToCoords(sq);
		if (!coords) {
			return 0;
		}
		const dx = coords.x - this.targetCoords.x;
		const dy = coords.y - this.targetCoords.y;

		if (dx >= 0 && dy > 0) {
			return 1;
		}
		if (dx < 0 && dy >= 0) {
			return 2;
		}
		if (dx <= 0 && dy < 0) {
			return 3;
		}
		if (dx > 0 && dy <= 0) {
			return 4;
		}
		return 0;
	}

	/**
	 * Enregistre un déplacement vers une nouvelle case.
	 *
	 * @param {string} toSquare - Case de destination (ex: 'a4')
	 * @return {{isFinished: boolean, totalAngleDeg: number, rotations: number, progressPercent: number}} Résultat du déplacement.
	 */
	onMove(toSquare) {
		const sq = toSquare.toLowerCase();
		const newAngle = this.getAngleFromTarget(sq);
		let delta = newAngle - this.lastAngle;

		// Normalisation dans [-PI, PI]
		while (delta > Math.PI) {
			delta -= 2 * Math.PI;
		}
		while (delta < -Math.PI) {
			delta += 2 * Math.PI;
		}

		this.totalAngle += delta;
		this.lastAngle = newAngle;
		this.currentSquare = sq;
		this.movesCount++;

		const quadrant = this.getQuadrant(sq);
		if (quadrant > 0) {
			this.quadrantsVisited.add(quadrant);
		}

		const rotations = Math.abs(this.totalAngle) / (2 * Math.PI);
		const hasFullTurn = rotations >= 0.95;
		const hasAllQuadrants = this.quadrantsVisited.size >= 4;
		const isAtStart = sq === this.startSquare;
		const isFinished =
			hasFullTurn && hasAllQuadrants && isAtStart && this.movesCount >= 4;

		const progressPercent = Math.min(
			100,
			Math.round(
				(Math.min(rotations, 1) * 0.7 +
					(this.quadrantsVisited.size / 4) * 0.3) *
					100
			)
		);

		return {
			isFinished,
			totalAngleDeg: Math.round((this.totalAngle * 180) / Math.PI),
			rotations,
			progressPercent: isFinished ? 100 : progressPercent,
		};
	}

	/**
	 * Réinitialise l'état du tracker au point de départ.
	 */
	reset() {
		this.currentSquare = this.startSquare;
		this.movesCount = 0;
		this.totalAngle = 0;
		this.lastAngle = this.getAngleFromTarget(this.startSquare);
		this.quadrantsVisited.clear();

		const initialQuadrant = this.getQuadrant(this.startSquare);
		if (initialQuadrant > 0) {
			this.quadrantsVisited.add(initialQuadrant);
		}
	}
}
