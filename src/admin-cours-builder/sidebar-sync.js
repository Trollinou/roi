/**
 * Sidebar metaboxes synchronization and DOM ordering.
 */

export function syncSidebarChapitreMetabox(chapterId, isLocked) {
	const metabox =
		document.getElementById('roi_chapitrediv') ||
		document.getElementById('taxonomy-roi_chapitre');
	if (!metabox) {
		return;
	}

	const inside = metabox.querySelector('.inside');

	if (isLocked && chapterId && String(chapterId) !== '0') {
		const inputs = metabox.querySelectorAll(
			`input[value="${chapterId}"], #in-roi_chapitre-${chapterId}`
		);
		inputs.forEach((input) => {
			input.checked = true;
			input.setAttribute('checked', 'checked');
			input.dispatchEvent(new Event('change', { bubbles: true }));
		});
		if (inside) {
			inside.style.pointerEvents = 'none';
			inside.style.opacity = '0.75';
		}
	} else if (!isLocked) {
		const checkedInputs = metabox.querySelectorAll(
			'input[type="radio"]:checked, input[type="checkbox"]:checked'
		);
		checkedInputs.forEach((input) => {
			input.checked = false;
			input.removeAttribute('checked');
		});
		if (inside) {
			inside.style.pointerEvents = 'auto';
			inside.style.opacity = '1';
		}
	}
}

export function setupSidebarMetaboxOrdering() {
	const menuOrderInput = document.getElementById('menu_order');
	if (menuOrderInput) {
		menuOrderInput.setAttribute('type', 'number');
		menuOrderInput.setAttribute('min', '0');
		menuOrderInput.setAttribute('step', '1');
		menuOrderInput.style.width = '80px';
	}

	const sideContainer = document.getElementById('side-sortables');
	if (sideContainer) {
		const boxPublier = document.getElementById('submitdiv');
		const boxOrdre = document.getElementById('pageparentdiv');
		const boxNiveau = document.getElementById('roi_cours_level_box');
		const boxChapitre =
			document.getElementById('roi_chapitrediv') ||
			document.getElementById('taxonomy-roi_chapitre');

		if (boxPublier && boxOrdre && boxNiveau && boxChapitre) {
			boxPublier.after(boxOrdre);
			boxOrdre.after(boxNiveau);
			boxNiveau.after(boxChapitre);
		}
	}
}
