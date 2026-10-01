/* global ajaxurl, roi_cours_builder */

import {
	createCatalogItemElement,
	createPlaylistItemElement,
} from './templates.js';
import {
	syncSidebarChapitreMetabox,
	setupSidebarMetaboxOrdering,
} from './sidebar-sync.js';
import { getDragAfterElement } from './drag-drop.js';

document.addEventListener('DOMContentLoaded', () => {
	const playlistJsonInput = document.getElementById(
		'roi_cours_playlist_json'
	);
	if (!playlistJsonInput) {
		return;
	}

	const catalogSearch = document.getElementById('roi_catalog_search');
	const catalogFilter = document.getElementById('roi_catalog_chapter_filter');
	const catalogLevelFilter = document.getElementById(
		'roi_catalog_level_filter'
	);
	const catalogUnassignedFilter = document.getElementById(
		'roi_catalog_unassigned_only'
	);
	const builderContainer = document.querySelector(
		'.roi-cours-builder-container'
	);
	const courseId =
		builderContainer && builderContainer.getAttribute('data-course-id')
			? builderContainer.getAttribute('data-course-id')
			: '0';
	const availableItemsContainer = document.getElementById(
		'roi_available_items'
	);
	const playlistContainer = document.getElementById('roi_playlist_items');

	const availableCountBadge = document.getElementById('roi_available_count');
	const playlistCountBadge = document.getElementById('roi_playlist_count');

	let draggedSource = null;
	let draggedData = null;
	let draggedElement = null;

	// Helper: Debounce
	const debounce = (func, delay = 300) => {
		let timer;
		return (...args) => {
			clearTimeout(timer);
			timer = setTimeout(() => func.apply(this, args), delay);
		};
	};

	// Helper: Get set of item keys currently in playlist
	const getPlaylistItemKeys = () => {
		const keys = new Set();
		const playlistItems = playlistContainer.querySelectorAll(
			'[data-playlist-item]'
		);
		playlistItems.forEach((el) => {
			const type = el.getAttribute('data-type');
			const id = el.getAttribute('data-id');
			if (type && id) {
				keys.add(`${type}_${id}`);
			}
		});
		return keys;
	};

	// Update playlist item counter
	const updatePlaylistCount = () => {
		const count = playlistContainer.querySelectorAll(
			'[data-playlist-item]'
		).length;
		if (playlistCountBadge) {
			playlistCountBadge.textContent = String(count);
		}
	};

	// Generate JSON String and update counters
	const updatePlaylistJson = () => {
		const items = [];
		const playlistItems = playlistContainer.querySelectorAll(
			'[data-playlist-item]'
		);
		playlistItems.forEach((el) => {
			items.push({
				type: el.getAttribute('data-type'),
				id: parseInt(el.getAttribute('data-id'), 10),
			});
		});
		playlistJsonInput.value = JSON.stringify(items);
		updatePlaylistCount();
	};

	// Enforce same chapter and level constraints by disabling dropdowns and updating level display
	const enforceSameChapterAndLevelConstraints = () => {
		const container = document.querySelector(
			'.roi-cours-builder-container'
		);
		const levelDisplay = document.getElementById('roi_cours_level_display');

		const firstItem = playlistContainer.querySelector(
			'[data-playlist-item]'
		);

		if (firstItem) {
			let lockedChapterId =
				firstItem.getAttribute('data-chapter-id') || '';
			if ((!lockedChapterId || lockedChapterId === '0') && container) {
				lockedChapterId =
					container.getAttribute('data-course-chapter-id') || '';
			}
			if (
				(!lockedChapterId || lockedChapterId === '0') &&
				catalogFilter &&
				catalogFilter.value
			) {
				lockedChapterId = catalogFilter.value;
			}

			let lockedLevel = firstItem.getAttribute('data-level') || '';
			if ((!lockedLevel || lockedLevel === '0') && container) {
				lockedLevel = container.getAttribute('data-course-level') || '';
			}

			if (lockedChapterId && lockedChapterId !== '0') {
				catalogFilter.value = String(lockedChapterId);
				syncSidebarChapitreMetabox(lockedChapterId, true);
			}
			catalogFilter.disabled = true;

			if (catalogLevelFilter) {
				if (lockedLevel && lockedLevel !== '0') {
					catalogLevelFilter.value = String(lockedLevel);
				}
				catalogLevelFilter.disabled = true;
			}

			if (levelDisplay && lockedLevel && lockedLevel !== '0') {
				levelDisplay.textContent = `Niveau ${lockedLevel}`;
			}
		} else {
			catalogFilter.disabled = false;
			if (catalogLevelFilter) {
				catalogLevelFilter.disabled = false;
			}
			if (levelDisplay) {
				levelDisplay.textContent =
					'Déterminé par le 1er élément du cours';
			}
			syncSidebarChapitreMetabox('', false);
		}

		searchCatalog();
	};

	// Search function
	const searchCatalog = async () => {
		const query = catalogSearch.value.trim();
		const chapter = catalogFilter.value;
		const level = catalogLevelFilter ? catalogLevelFilter.value : '';
		const unassigned =
			catalogUnassignedFilter && catalogUnassignedFilter.checked
				? '1'
				: '0';

		availableItemsContainer.innerHTML = `<div style="padding: 10px; color: #888;">Recherche en cours...</div>`;

		try {
			const response = await fetch(
				`${ajaxurl}?action=roi_search_cours_items&security=${
					roi_cours_builder.nonce
				}&q=${encodeURIComponent(
					query
				)}&chapter=${chapter}&level=${level}&unassigned=${unassigned}&course_id=${courseId}`
			);
			const resJson = await response.json();

			if (resJson.success) {
				renderCatalog(resJson.data);
			} else {
				availableItemsContainer.innerHTML = `<div style="padding: 10px; color: #d63638;">Erreur lors de la recherche.</div>`;
				if (availableCountBadge) {
					availableCountBadge.textContent = '0';
				}
			}
		} catch (err) {
			console.error('Search error', err);
			availableItemsContainer.innerHTML = `<div style="padding: 10px; color: #d63638;">Erreur réseau.</div>`;
			if (availableCountBadge) {
				availableCountBadge.textContent = '0';
			}
		}
	};

	const renderCatalog = (items) => {
		availableItemsContainer.innerHTML = '';
		if (!items || items.length === 0) {
			availableItemsContainer.innerHTML = `<div style="padding: 10px; color: #888;">Aucun élément trouvé.</div>`;
			if (availableCountBadge) {
				availableCountBadge.textContent = '0';
			}
			return;
		}

		const playlistKeys = getPlaylistItemKeys();
		const filteredItems = items.filter(
			(item) => !playlistKeys.has(`${item.type}_${item.id}`)
		);

		if (availableCountBadge) {
			availableCountBadge.textContent = String(filteredItems.length);
		}

		if (filteredItems.length === 0) {
			availableItemsContainer.innerHTML = `<div style="padding: 10px; color: #888;">Tous les éléments correspondant à vos critères sont déjà dans le cours.</div>`;
			return;
		}

		filteredItems.forEach((item) => {
			const el = createCatalogItemElement(item, (e) => {
				draggedSource = 'catalog';
				let effectiveChapterId = item.chapter_id;
				if (
					(!effectiveChapterId ||
						effectiveChapterId === 0 ||
						effectiveChapterId === '0') &&
					catalogFilter &&
					catalogFilter.value
				) {
					effectiveChapterId = catalogFilter.value;
				}
				draggedData = {
					id: item.id,
					type: item.type,
					title: item.titre,
					color: item.color,
					level: item.niveau,
					chapterId: effectiveChapterId,
				};
				e.dataTransfer.effectAllowed = 'copy';
			});

			availableItemsContainer.appendChild(el);
		});
	};

	const createPlaylistItem = (id, title, type, color, level, chapterId) => {
		return createPlaylistItemElement(
			{ id, title, type, color, level, chapterId },
			{
				onRemove: (el) => {
					el.remove();
					updatePlaylistJson();
					enforceSameChapterAndLevelConstraints();
				},
				onDragStart: (el) => {
					draggedSource = 'playlist';
					draggedElement = el;
				},
				onDragEnd: () => {
					draggedSource = null;
					draggedElement = null;
				},
			}
		);
	};

	// Drag & Drop Playlist Container logic
	playlistContainer.addEventListener('dragover', (e) => {
		e.preventDefault();
		const afterElement = getDragAfterElement(playlistContainer, e.clientY);
		if (draggedSource === 'playlist' && draggedElement) {
			if (afterElement === null) {
				playlistContainer.appendChild(draggedElement);
			} else {
				playlistContainer.insertBefore(draggedElement, afterElement);
			}
		}
	});

	playlistContainer.addEventListener('drop', (e) => {
		e.preventDefault();
		if (draggedSource === 'catalog' && draggedData) {
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
			if (afterElement === null) {
				playlistContainer.appendChild(newItem);
			} else {
				playlistContainer.insertBefore(newItem, afterElement);
			}
			updatePlaylistJson();
			enforceSameChapterAndLevelConstraints();
		} else if (draggedSource === 'playlist') {
			updatePlaylistJson();
			enforceSameChapterAndLevelConstraints();
		}
	});

	// Setup sidebar order
	setupSidebarMetaboxOrdering();

	// Search actions
	catalogSearch.addEventListener('input', debounce(searchCatalog, 300));
	catalogFilter.addEventListener('change', searchCatalog);
	if (catalogLevelFilter) {
		catalogLevelFilter.addEventListener('change', searchCatalog);
	}
	if (catalogUnassignedFilter) {
		catalogUnassignedFilter.addEventListener('change', searchCatalog);
	}

	// Initialize items list with constraint checks and initial count
	updatePlaylistCount();
	enforceSameChapterAndLevelConstraints();

	// Bind initial events to any existing DOM elements if any
	const bindExistingItems = () => {
		playlistContainer
			.querySelectorAll('[data-playlist-item]')
			.forEach((el) => {
				el.querySelector('.roi-playlist-item-remove').addEventListener(
					'click',
					() => {
						el.remove();
						updatePlaylistJson();
						enforceSameChapterAndLevelConstraints();
					}
				);

				el.addEventListener('dragstart', () => {
					draggedSource = 'playlist';
					draggedElement = el;
					el.classList.add('dragging');
					el.style.opacity = '0.5';
				});

				el.addEventListener('dragend', () => {
					el.classList.remove('dragging');
					el.style.opacity = '1';
					draggedSource = null;
					draggedElement = null;
				});
			});
	};

	bindExistingItems();
});
