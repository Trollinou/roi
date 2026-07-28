/* global ajaxurl, roi_cours_builder */

document.addEventListener( 'DOMContentLoaded', () => {
	const playlistJsonInput = document.getElementById(
		'roi_cours_playlist_json'
	);
	if ( ! playlistJsonInput ) {
		return;
	}

	const catalogSearch = document.getElementById( 'roi_catalog_search' );
	const catalogFilter = document.getElementById(
		'roi_catalog_chapter_filter'
	);
	const catalogLevelFilter = document.getElementById(
		'roi_catalog_level_filter'
	);
	const availableItemsContainer = document.getElementById(
		'roi_available_items'
	);
	const playlistContainer = document.getElementById( 'roi_playlist_items' );

	const availableCountBadge = document.getElementById(
		'roi_available_count'
	);
	const playlistCountBadge = document.getElementById( 'roi_playlist_count' );

	let draggedSource = null;
	let draggedData = null;
	let draggedElement = null;

	// Palette of modern/pastel colors for badges
	const colorPalette = {
		primary: { bg: '#e5f3ff', border: '#0073aa', text: '#005a87' },
		warning: { bg: '#fff5ec', border: '#d94f00', text: '#a63c00' },
		danger: { bg: '#fbeaea', border: '#d63638', text: '#9e2526' },
		success: { bg: '#edfaef', border: '#00a32a', text: '#00701c' },
		tertiary: { bg: '#f5ecfc', border: '#8224e3', text: '#5c16a6' },
	};

	const getColorStyle = ( key ) => {
		return colorPalette[ key ] || colorPalette.primary;
	};

	// Helper: Debounce
	const debounce = ( func, delay = 300 ) => {
		let timer;
		return ( ...args ) => {
			clearTimeout( timer );
			timer = setTimeout( () => func.apply( this, args ), delay );
		};
	};

	// Helper: Get set of item keys currently in playlist
	const getPlaylistItemKeys = () => {
		const keys = new Set();
		const playlistItems = playlistContainer.querySelectorAll(
			'[data-playlist-item]'
		);
		playlistItems.forEach( ( el ) => {
			const type = el.getAttribute( 'data-type' );
			const id = el.getAttribute( 'data-id' );
			if ( type && id ) {
				keys.add( `${ type }_${ id }` );
			}
		} );
		return keys;
	};

	// Update playlist item counter
	const updatePlaylistCount = () => {
		const count = playlistContainer.querySelectorAll(
			'[data-playlist-item]'
		).length;
		if ( playlistCountBadge ) {
			playlistCountBadge.textContent = String( count );
		}
	};

	// Search function
	const searchCatalog = async () => {
		const query = catalogSearch.value.trim();
		const chapter = catalogFilter.value;
		const level = catalogLevelFilter ? catalogLevelFilter.value : '';

		availableItemsContainer.innerHTML = `<div style="padding: 10px; color: #888;">Recherche en cours...</div>`;

		try {
			const response = await fetch(
				`${ ajaxurl }?action=roi_search_cours_items&security=${
					roi_cours_builder.nonce
				}&q=${ encodeURIComponent(
					query
				) }&chapter=${ chapter }&level=${ level }`
			);
			const resJson = await response.json();

			if ( resJson.success ) {
				renderCatalog( resJson.data );
			} else {
				availableItemsContainer.innerHTML = `<div style="padding: 10px; color: #d63638;">Erreur lors de la recherche.</div>`;
				if ( availableCountBadge ) {
					availableCountBadge.textContent = '0';
				}
			}
		} catch ( err ) {
			console.error( 'Search error', err );
			availableItemsContainer.innerHTML = `<div style="padding: 10px; color: #d63638;">Erreur réseau.</div>`;
			if ( availableCountBadge ) {
				availableCountBadge.textContent = '0';
			}
		}
	};

	const renderCatalog = ( items ) => {
		availableItemsContainer.innerHTML = '';
		if ( ! items || items.length === 0 ) {
			availableItemsContainer.innerHTML = `<div style="padding: 10px; color: #888;">Aucun élément trouvé.</div>`;
			if ( availableCountBadge ) {
				availableCountBadge.textContent = '0';
			}
			return;
		}

		const playlistKeys = getPlaylistItemKeys();
		const filteredItems = items.filter(
			( item ) => ! playlistKeys.has( `${ item.type }_${ item.id }` )
		);

		if ( availableCountBadge ) {
			availableCountBadge.textContent = String( filteredItems.length );
		}

		if ( filteredItems.length === 0 ) {
			availableItemsContainer.innerHTML = `<div style="padding: 10px; color: #888;">Tous les éléments correspondant à vos critères sont déjà dans le cours.</div>`;
			return;
		}

		filteredItems.forEach( ( item ) => {
			const styles = getColorStyle( item.color );
			const el = document.createElement( 'div' );
			el.classList.add( 'roi-catalog-item' );
			el.setAttribute( 'draggable', 'true' );
			el.setAttribute( 'data-id', item.id );
			el.setAttribute( 'data-type', item.type );
			el.setAttribute( 'data-title', item.titre );
			el.setAttribute( 'data-color', item.color );
			el.setAttribute( 'data-level', item.niveau );
			el.setAttribute( 'data-chapter-id', item.chapter_id );

			el.style.padding = '10px';
			el.style.border = `1px solid ${ styles.border }`;
			el.style.background = styles.bg;
			el.style.color = styles.text;
			el.style.borderRadius = '4px';
			el.style.cursor = 'grab';
			el.style.fontSize = '13px';
			el.style.fontWeight = '500';
			el.style.display = 'flex';
			el.style.justifyContent = 'space-between';
			el.style.alignItems = 'center';

			const typeLabel = item.type === 'roi_lecon' ? 'Leçon' : 'Exercice';
			el.innerHTML = `
				<span>${ item.titre }</span>
				<div style="display: flex; gap: 5px; align-items: center;">
					<span style="font-size: 10px; background: rgba(255,255,255,0.6); border: 1px solid ${ styles.border }; padding: 1px 5px; border-radius: 3px;">
						Niv. ${ item.niveau }
					</span>
					<span style="font-size: 10px; text-transform: uppercase; background: ${ styles.border }; color: #fff; padding: 2px 6px; border-radius: 3px;">
						${ typeLabel }
					</span>
				</div>
			`;

			el.addEventListener( 'dragstart', ( e ) => {
				draggedSource = 'catalog';
				draggedData = {
					id: item.id,
					type: item.type,
					title: item.titre,
					color: item.color,
					level: item.niveau,
					chapterId: item.chapter_id,
				};
				e.dataTransfer.effectAllowed = 'copy';
			} );

			availableItemsContainer.appendChild( el );
		} );
	};

	// Create Playlist Item Element
	const createPlaylistItem = ( id, title, type, color, level, chapterId ) => {
		const styles = getColorStyle( color );
		const el = document.createElement( 'div' );
		el.classList.add( 'roi-playlist-item' );
		el.setAttribute( 'data-playlist-item', 'true' );
		el.setAttribute( 'draggable', 'true' );
		el.setAttribute( 'data-id', id );
		el.setAttribute( 'data-type', type );
		el.setAttribute( 'data-title', title );
		el.setAttribute( 'data-color', color );
		el.setAttribute( 'data-level', level );
		el.setAttribute( 'data-chapter-id', chapterId );

		el.style.padding = '10px';
		el.style.border = `1px solid ${ styles.border }`;
		el.style.background = '#fff';
		el.style.color = '#333';
		el.style.borderRadius = '4px';
		el.style.cursor = 'move';
		el.style.fontSize = '13px';
		el.style.display = 'flex';
		el.style.justifyContent = 'space-between';
		el.style.alignItems = 'center';
		el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';

		const typeLabel = type === 'roi_lecon' ? 'Leçon' : 'Exercice';
		el.innerHTML = `
			<div style="display: flex; align-items: center; gap: 8px;">
				<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${ styles.border };"></span>
				<strong style="color: ${ styles.text }; font-size: 11px;">[${ typeLabel }]</strong>
				<span>${ title }</span>
			</div>
			<button type="button" class="roi-playlist-item-remove" style="background: none; border: none; color: #bbb; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0 5px;" onmouseover="this.style.color='#d63638'" onmouseout="this.style.color='#bbb'">&times;</button>
		`;

		// Bind delete button
		el.querySelector( '.roi-playlist-item-remove' ).addEventListener(
			'click',
			() => {
				el.remove();
				updatePlaylistJson();
				enforceSameChapterAndLevelConstraints();
			}
		);

		// Drag events within playlist
		el.addEventListener( 'dragstart', () => {
			draggedSource = 'playlist';
			draggedElement = el;
			el.classList.add( 'dragging' );
			el.style.opacity = '0.5';
		} );

		el.addEventListener( 'dragend', () => {
			el.classList.remove( 'dragging' );
			el.style.opacity = '1';
			draggedSource = null;
			draggedElement = null;
		} );

		return el;
	};

	// Drag & Drop Playlist Container logic
	playlistContainer.addEventListener( 'dragover', ( e ) => {
		e.preventDefault();
		const afterElement = getDragAfterElement(
			playlistContainer,
			e.clientY
		);
		if ( draggedSource === 'playlist' && draggedElement ) {
			if ( afterElement === null ) {
				playlistContainer.appendChild( draggedElement );
			} else {
				playlistContainer.insertBefore( draggedElement, afterElement );
			}
		}
	} );

	playlistContainer.addEventListener( 'drop', ( e ) => {
		e.preventDefault();
		if ( draggedSource === 'catalog' && draggedData ) {
			const newItem = createPlaylistItem(
				draggedData.id,
				draggedData.title,
				draggedData.type,
				draggedData.color,
				draggedData.level,
				draggedData.chapterId
			);

			const afterElement = getDragAfterElement(
				playlistContainer,
				e.clientY
			);
			if ( afterElement === null ) {
				playlistContainer.appendChild( newItem );
			} else {
				playlistContainer.insertBefore( newItem, afterElement );
			}
			updatePlaylistJson();
			enforceSameChapterAndLevelConstraints();
		} else if ( draggedSource === 'playlist' ) {
			updatePlaylistJson();
			enforceSameChapterAndLevelConstraints();
		}
	} );

	// Find the drag insertion element position
	const getDragAfterElement = ( container, y ) => {
		const draggableElements = [
			...container.querySelectorAll(
				'[data-playlist-item]:not(.dragging)'
			),
		];

		return draggableElements.reduce(
			( closest, child ) => {
				const box = child.getBoundingClientRect();
				const offset = y - box.top - box.height / 2;
				if ( offset < 0 && offset > closest.offset ) {
					return { offset, element: child };
				}
				return closest;
			},
			{ offset: Number.NEGATIVE_INFINITY }
		).element;
	};

	// Generate JSON String and update counters
	const updatePlaylistJson = () => {
		const items = [];
		const playlistItems = playlistContainer.querySelectorAll(
			'[data-playlist-item]'
		);
		playlistItems.forEach( ( el ) => {
			items.push( {
				type: el.getAttribute( 'data-type' ),
				id: parseInt( el.getAttribute( 'data-id' ), 10 ),
			} );
		} );
		playlistJsonInput.value = JSON.stringify( items );
		updatePlaylistCount();
	};

	// Enforce same chapter and level constraints by disabling dropdowns
	const enforceSameChapterAndLevelConstraints = () => {
		const firstItem = playlistContainer.querySelector(
			'[data-playlist-item]'
		);
		if ( firstItem ) {
			const lockedChapterId = firstItem.getAttribute( 'data-chapter-id' );
			const lockedLevel = firstItem.getAttribute( 'data-level' );

			catalogFilter.value = lockedChapterId;
			catalogFilter.disabled = true;

			if ( catalogLevelFilter ) {
				catalogLevelFilter.value = lockedLevel;
				catalogLevelFilter.disabled = true;
			}
		} else {
			catalogFilter.disabled = false;
			if ( catalogLevelFilter ) {
				catalogLevelFilter.disabled = false;
			}
		}
		searchCatalog();
	};

	// Search actions
	catalogSearch.addEventListener( 'input', debounce( searchCatalog, 300 ) );
	catalogFilter.addEventListener( 'change', searchCatalog );
	if ( catalogLevelFilter ) {
		catalogLevelFilter.addEventListener( 'change', searchCatalog );
	}

	// Initialize items list with constraint checks and initial count
	updatePlaylistCount();
	enforceSameChapterAndLevelConstraints();

	// Bind initial events to any existing DOM elements if any
	const bindExistingItems = () => {
		playlistContainer
			.querySelectorAll( '[data-playlist-item]' )
			.forEach( ( el ) => {
				el.querySelector(
					'.roi-playlist-item-remove'
				).addEventListener( 'click', () => {
					el.remove();
					updatePlaylistJson();
					enforceSameChapterAndLevelConstraints();
				} );

				el.addEventListener( 'dragstart', () => {
					draggedSource = 'playlist';
					draggedElement = el;
					el.classList.add( 'dragging' );
					el.style.opacity = '0.5';
				} );

				el.addEventListener( 'dragend', () => {
					el.classList.remove( 'dragging' );
					el.style.opacity = '1';
					draggedSource = null;
					draggedElement = null;
				} );
			} );
	};

	bindExistingItems();
} );
