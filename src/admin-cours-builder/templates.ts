export interface ColorStyle {
  bg: string;
  border: string;
  text: string;
}

export const COLOR_PALETTE: Record<string, ColorStyle> = {
  primary: { bg: '#e5f3ff', border: '#0073aa', text: '#005a87' },
  warning: { bg: '#fff5ec', border: '#d94f00', text: '#a63c00' },
  danger: { bg: '#fbeaea', border: '#d63638', text: '#9e2526' },
  success: { bg: '#edfaef', border: '#00a32a', text: '#00701c' },
  tertiary: { bg: '#f5ecfc', border: '#8224e3', text: '#5c16a6' },
};

export const getColorStyle = (key?: string): ColorStyle => {
  return (key && COLOR_PALETTE[key]) || COLOR_PALETTE.primary;
};

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
  const styles = getColorStyle(item.color);
  const el = document.createElement('div');
  el.classList.add('roi-catalog-item');
  el.setAttribute('draggable', 'true');
  el.setAttribute('data-id', String(item.id));
  el.setAttribute('data-type', item.type);
  el.setAttribute('data-title', item.titre);
  el.setAttribute('data-color', item.color || '');
  el.setAttribute('data-level', String(item.niveau || ''));
  el.setAttribute('data-chapter-id', String(item.chapter_id || ''));

  el.style.padding = '10px';
  el.style.border = `1px solid ${styles.border}`;
  el.style.background = styles.bg;
  el.style.color = styles.text;
  el.style.borderRadius = '4px';
  el.style.cursor = 'grab';
  el.style.fontSize = '13px';
  el.style.fontWeight = '500';
  el.style.display = 'flex';
  el.style.justifyContent = 'space-between';
  el.style.alignItems = 'center';

  let typeLabel = 'Exercice';
  if (item.type === 'roi_lecon') {
    typeLabel = 'Leçon';
  } else if (item.type === 'roi_video') {
    typeLabel = 'Vidéo';
  }
  el.innerHTML = `
		<span style="word-break: break-word; overflow-wrap: anywhere;">${item.titre}</span>
		<div style="display: flex; gap: 5px; align-items: center; flex-shrink: 0;">
			<span style="font-size: 10px; white-space: nowrap; flex-shrink: 0; background: rgba(255,255,255,0.6); border: 1px solid ${styles.border}; padding: 1px 5px; border-radius: 3px;">
				Niv.&nbsp;${item.niveau || 1}
			</span>
			<span style="font-size: 10px; white-space: nowrap; flex-shrink: 0; text-transform: uppercase; background: ${styles.border}; color: #fff; padding: 2px 6px; border-radius: 3px;">
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
  const styles = getColorStyle(color);
  const el = document.createElement('div');
  el.classList.add('roi-playlist-item');
  el.setAttribute('data-playlist-item', 'true');
  el.setAttribute('draggable', 'true');
  el.setAttribute('data-id', String(id));
  el.setAttribute('data-type', type);
  el.setAttribute('data-title', title);
  el.setAttribute('data-color', color || '');
  el.setAttribute('data-level', String(level || ''));
  el.setAttribute('data-chapter-id', String(chapterId || ''));

  el.style.padding = '10px';
  el.style.border = `1px solid ${styles.border}`;
  el.style.background = styles.bg;
  el.style.color = styles.text;
  el.style.borderRadius = '4px';
  el.style.cursor = 'move';
  el.style.fontSize = '13px';
  el.style.fontWeight = '500';
  el.style.display = 'flex';
  el.style.justifyContent = 'space-between';
  el.style.alignItems = 'center';
  el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';

  let typeLabel = 'Exercice';
  if (type === 'roi_lecon') {
    typeLabel = 'Leçon';
  } else if (type === 'roi_video') {
    typeLabel = 'Vidéo';
  }
  el.innerHTML = `
		<span style="word-break: break-word; overflow-wrap: anywhere;">${title}</span>
		<div style="display: flex; gap: 5px; align-items: center; flex-shrink: 0;">
			<span style="font-size: 10px; white-space: nowrap; flex-shrink: 0; background: rgba(255,255,255,0.6); border: 1px solid ${styles.border}; padding: 1px 5px; border-radius: 3px;">
				Niv.&nbsp;${level || 1}
			</span>
			<span style="font-size: 10px; white-space: nowrap; flex-shrink: 0; text-transform: uppercase; background: ${styles.border}; color: #fff; padding: 2px 6px; border-radius: 3px;">
				${typeLabel}
			</span>
			<button type="button" class="roi-playlist-item-remove" style="background: none; border: none; color: ${styles.text}; opacity: 0.6; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1; padding: 0 0 0 5px;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">&times;</button>
		</div>
	`;

  const removeBtn = el.querySelector('.roi-playlist-item-remove');
  if (removeBtn && onRemove) {
    removeBtn.addEventListener('click', () => onRemove(el));
  }

  el.addEventListener('dragstart', () => {
    el.classList.add('dragging');
    el.style.opacity = '0.5';
    if (onDragStart) {
      onDragStart(el);
    }
  });

  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    el.style.opacity = '1';
    if (onDragEnd) {
      onDragEnd(el);
    }
  });

  return el;
}
