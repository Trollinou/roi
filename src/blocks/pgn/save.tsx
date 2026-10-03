import React from 'react';
import { useBlockProps } from '@wordpress/block-editor';
import type { PgnBlockAttributes } from './edit';

interface SaveProps {
	attributes: PgnBlockAttributes;
}

export default function Save({ attributes }: SaveProps): React.ReactElement {
	const pgn = attributes.pgn || '';

	const blockProps = useBlockProps.save({
		className: 'roi-bloc-pgn chessboard-block',
		'data-wp-interactive': 'roi/pgn',
		'data-wp-context': JSON.stringify({
			pgn,
		}),
		'data-pgn': pgn,
	});

	return (
		<div {...blockProps}>
			<section className="main-wrap">
				<div className="main-board">
					<div className="pgn-mount-element" data-wp-init="callbacks.mountPgn"></div>
				</div>
				{pgn && (
					<div className="pgn-navigation-bar">
						<button
							type="button"
							className="pgn-nav-btn pgn-btn-start"
							title="Début"
							data-wp-on--click="actions.viewStart"
						>
							|&lt;
						</button>
						<button
							type="button"
							className="pgn-nav-btn pgn-btn-prev"
							title="Précédent"
							data-wp-on--click="actions.viewPrev"
						>
							&lt;
						</button>
						<button
							type="button"
							className="pgn-nav-btn pgn-btn-next"
							title="Suivant"
							data-wp-on--click="actions.viewNext"
						>
							&gt;
						</button>
						<button
							type="button"
							className="pgn-nav-btn pgn-btn-end"
							title="Fin"
							data-wp-on--click="actions.viewEnd"
						>
							&gt;|
						</button>
						<button
							type="button"
							className="pgn-nav-btn pgn-btn-flip"
							title="Retourner l'échiquier"
							data-wp-on--click="actions.flipBoard"
						>
							🔄
						</button>
					</div>
				)}
			</section>
		</div>
	);
}
