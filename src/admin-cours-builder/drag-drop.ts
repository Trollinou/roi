/**
 * Drag and Drop interaction helpers for Playlist Container.
 */

export function getDragAfterElement(container: HTMLElement, y: number): HTMLElement | null {
  const draggableElements = [
    ...container.querySelectorAll<HTMLElement>('[data-playlist-item]:not(.dragging)'),
  ];

  const result = draggableElements.reduce<{ offset: number; element: HTMLElement | null }>(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    },
    { offset: Number.NEGATIVE_INFINITY, element: null }
  );

  return result.element;
}
