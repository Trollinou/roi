export interface CatalogItem {
  id: number | string;
  type: string;
  titre: string;
  color?: string;
  niveau?: number | string;
  chapter_id?: number | string;
}

export function createCatalogItemElement(
  item: CatalogItem,
  onDragStart?: (e: DragEvent, item: CatalogItem) => void
): HTMLDivElement {
  const el = document.createElement('div');
  el.classList.add('roi-catalog-item');
  el.setAttribute('draggable', 'true');
  el.setAttribute('data-id', String(item.id));
  el.setAttribute('data-type', item.type);
  el.setAttribute('data-title', item.titre);
  el.setAttribute('data-color', item.color || 'primary');
  el.setAttribute('data-level', String(item.niveau || '1'));
  el.setAttribute('data-chapter-id', String(item.chapter_id || ''));

  let typeLabel = 'Exercice';
  if (item.type === 'roi_lecon') {
    typeLabel = 'Leçon';
  } else if (item.type === 'roi_video') {
    typeLabel = 'Vidéo';
  }
  el.innerHTML = `
		<span class="roi-cours-item-title">${item.titre}</span>
		<div class="roi-cours-item-meta">
			<span class="roi-cours-badge-level">
				Niv.&nbsp;${item.niveau || 1}
			</span>
			<span class="roi-cours-badge-type">
				${typeLabel}
			</span>
		</div>
	`;

  if (onDragStart) {
    el.addEventListener('dragstart', (e) => onDragStart(e, item));
  }

  return el;
}

export interface PlaylistItemData {
  id: number | string;
  title: string;
  type: string;
  color?: string;
  level?: number | string;
  chapterId?: number | string;
}

export interface PlaylistItemCallbacks {
  onRemove?: (el: HTMLElement) => void;
  onDragStart?: (el: HTMLElement) => void;
  onDragEnd?: (el: HTMLElement) => void;
}

export function createPlaylistItemElement(
  { id, title, type, color, level, chapterId }: PlaylistItemData,
  { onRemove, onDragStart, onDragEnd }: PlaylistItemCallbacks
): HTMLDivElement {
  const el = document.createElement('div');
  el.classList.add('roi-playlist-item');
  el.setAttribute('data-playlist-item', 'true');
  el.setAttribute('draggable', 'true');
  el.setAttribute('data-id', String(id));
  el.setAttribute('data-type', type);
  el.setAttribute('data-title', title);
  el.setAttribute('data-color', color || 'primary');
  el.setAttribute('data-level', String(level || '1'));
  el.setAttribute('data-chapter-id', String(chapterId || ''));

  let typeLabel = 'Exercice';
  if (type === 'roi_lecon') {
    typeLabel = 'Leçon';
  } else if (type === 'roi_video') {
    typeLabel = 'Vidéo';
  }
  el.innerHTML = `
		<span class="roi-cours-item-title">${title}</span>
		<div class="roi-cours-item-meta">
			<span class="roi-cours-badge-level">
				Niv.&nbsp;${level || 1}
			</span>
			<span class="roi-cours-badge-type">
				${typeLabel}
			</span>
			<button type="button" class="roi-playlist-item-remove">&times;</button>
		</div>
	`;

  const removeBtn = el.querySelector('.roi-playlist-item-remove');
  if (removeBtn && onRemove) {
    removeBtn.addEventListener('click', () => onRemove(el));
  }

  el.addEventListener('dragstart', () => {
    el.classList.add('dragging');
    if (onDragStart) {
      onDragStart(el);
    }
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    if (onDragEnd) {
      onDragEnd(el);
    }
  });

  return el;
}
