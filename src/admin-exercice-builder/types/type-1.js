/**
 * Handler for Type 1: 100 Commandements.
 */

const textarea = document.getElementById('roi_config_json');
let qcmsData = [];

/**
 * Serializes configuration to JSON.
 */
export function updateConfig() {
	if (!textarea) {
		return;
	}

	const container = document.getElementById('roi_t1_qcms_container');
	if (!container) {
		return;
	}

	const qcmItems = container.querySelectorAll('.roi-t1-qcm-item');
	const qcmsArr = [];

	qcmItems.forEach((item) => {
		const questionInput = item.querySelector('.roi_t1_question');
		const questionText = questionInput ? questionInput.value : '';

		const reponsesInputs = item.querySelectorAll('.roi_t1_reponse');
		const reponsesArr = ['', '', ''];

		reponsesInputs.forEach((repInput) => {
			const optIndex = parseInt(repInput.getAttribute('data-opt'), 10);
			if (!isNaN(optIndex) && optIndex >= 0 && optIndex < 3) {
				reponsesArr[optIndex] = repInput.value;
			}
		});

		let bonneReponse = 0;
		const radios = item.querySelectorAll('.roi_t1_correct');
		radios.forEach((radio) => {
			if (radio.checked) {
				bonneReponse = parseInt(radio.value, 10);
			}
		});

		qcmsArr.push({
			question: questionText,
			reponses: reponsesArr,
			bonne_reponse: isNaN(bonneReponse) ? 0 : bonneReponse,
		});
	});

	qcmsData = qcmsArr;
	textarea.value = JSON.stringify({ qcms: qcmsData }, null, 4);
}

/**
 * Re-indexes title numbers, data-index, and radio button names in the QCM container.
 */
function reindexQcms() {
	const container = document.getElementById('roi_t1_qcms_container');
	if (!container) {
		return;
	}

	const items = container.querySelectorAll('.roi-t1-qcm-item');
	items.forEach((item, index) => {
		item.setAttribute('data-index', index.toString());

		const titleEl = item.querySelector('.roi-t1-qcm-title');
		if (titleEl) {
			titleEl.textContent = `QCM #${index + 1}`;
		}

		const radios = item.querySelectorAll('.roi_t1_correct');
		radios.forEach((radio) => {
			radio.setAttribute('name', `roi_t1_correct_${index}`);
		});

		const removeBtn = item.querySelector('.roi_t1_remove_qcm');
		if (removeBtn) {
			removeBtn.style.display = items.length > 1 ? '' : 'none';
		}
	});
}

/**
 * Helper to escape attributes in dynamically generated HTML string.
 *
 * @param {string} str Raw string.
 * @return {string} Escaped string.
 */
function escapeAttr(str) {
	return String(str || '')
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * Creates and returns a QCM item DOM element.
 *
 * @param {Object|null} qcmData QCM data object.
 * @return {HTMLElement} Created item element.
 */
function createQcmElement(qcmData = null) {
	const index = document.querySelectorAll('.roi-t1-qcm-item').length;
	const item = document.createElement('div');
	item.className = 'roi-t1-qcm-item';
	item.setAttribute('data-index', index.toString());
	item.style.border = '1px solid #e0e0e0';
	item.style.padding = '12px';
	item.style.borderRadius = '4px';
	item.style.backgroundColor = '#fafafa';

	const qText =
		qcmData && typeof qcmData.question === 'string' ? qcmData.question : '';
	const reps =
		qcmData && Array.isArray(qcmData.reponses)
			? qcmData.reponses
			: ['', '', ''];
	const bonne =
		qcmData && typeof qcmData.bonne_reponse !== 'undefined'
			? parseInt(qcmData.bonne_reponse, 10)
			: 0;

	item.innerHTML = `
		<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 6px;">
			<strong class="roi-t1-qcm-title">QCM #${index + 1}</strong>
			<button type="button" class="button roi_t1_remove_qcm" style="color: #b32d2e; border-color: #b32d2e; font-weight: bold;">Supprimer ce QCM</button>
		</div>
		<p style="margin-top: 0;">
			<label><strong>Question :</strong></label><br>
			<input type="text" class="roi_t1_question large-text" value="${escapeAttr(qText)}" style="width: 100%;">
		</p>
		<p style="margin-bottom: 5px;"><strong>Réponses (sélectionnez la bonne réponse) :</strong></p>
		<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
			<input type="radio" class="roi_t1_correct" name="roi_t1_correct_${index}" value="0" ${bonne === 0 ? 'checked' : ''}>
			<input type="text" class="roi_t1_reponse" data-opt="0" value="${escapeAttr(reps[0] || '')}" style="flex: 1;" placeholder="Réponse 1">
		</div>
		<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
			<input type="radio" class="roi_t1_correct" name="roi_t1_correct_${index}" value="1" ${bonne === 1 ? 'checked' : ''}>
			<input type="text" class="roi_t1_reponse" data-opt="1" value="${escapeAttr(reps[1] || '')}" style="flex: 1;" placeholder="Réponse 2">
		</div>
		<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
			<input type="radio" class="roi_t1_correct" name="roi_t1_correct_${index}" value="2" ${bonne === 2 ? 'checked' : ''}>
			<input type="text" class="roi_t1_reponse" data-opt="2" value="${escapeAttr(reps[2] || '')}" style="flex: 1;" placeholder="Réponse 3">
		</div>
	`;

	bindItemEvents(item);
	return item;
}

/**
 * Attaches event listeners to input/radio/button elements of a QCM item.
 *
 * @param {HTMLElement} item QCM item element.
 */
function bindItemEvents(item) {
	const questionInput = item.querySelector('.roi_t1_question');
	if (questionInput) {
		questionInput.addEventListener('input', updateConfig);
	}

	const reponsesInputs = item.querySelectorAll('.roi_t1_reponse');
	reponsesInputs.forEach((input) => {
		input.addEventListener('input', updateConfig);
	});

	const radios = item.querySelectorAll('.roi_t1_correct');
	radios.forEach((radio) => {
		radio.addEventListener('change', updateConfig);
	});

	const removeBtn = item.querySelector('.roi_t1_remove_qcm');
	if (removeBtn) {
		removeBtn.addEventListener('click', () => {
			const container = document.getElementById('roi_t1_qcms_container');
			if (
				container &&
				container.querySelectorAll('.roi-t1-qcm-item').length > 1
			) {
				item.remove();
				reindexQcms();
				updateConfig();
			}
		});
	}
}

/**
 * Initializes Type 1.
 */
export function init() {
	if (!textarea) {
		return;
	}

	const container = document.getElementById('roi_t1_qcms_container');

	if (!container) {
		return;
	}

	const addBtn = document.getElementById('roi_t1_add_qcm');

	qcmsData = [];

	// Parse saved JSON if present
	if (textarea.value.trim() !== '') {
		try {
			const parsed = JSON.parse(textarea.value);
			if (parsed && typeof parsed === 'object') {
				if (Array.isArray(parsed.qcms) && parsed.qcms.length > 0) {
					qcmsData = parsed.qcms;
				} else if (typeof parsed.question === 'string') {
					// Backward compatibility with single QCM
					qcmsData = [
						{
							question: parsed.question,
							reponses: Array.isArray(parsed.reponses)
								? parsed.reponses
								: ['', '', ''],
							bonne_reponse:
								typeof parsed.bonne_reponse !== 'undefined'
									? parseInt(parsed.bonne_reponse, 10)
									: 0,
						},
					];
				}
			}
		} catch (e) {
			console.warn('Erreur parsing JSON Type 1 initial :', e);
		}
	}

	// If qcmsData has items, rebuild DOM container from qcmsData
	if (qcmsData.length > 0) {
		container.innerHTML = '';
		qcmsData.forEach((qcmItem) => {
			const el = createQcmElement(qcmItem);
			container.appendChild(el);
		});
	} else {
		// Bind existing PHP rendered DOM items if any
		const existingItems = container.querySelectorAll('.roi-t1-qcm-item');
		if (existingItems.length > 0) {
			existingItems.forEach((item) => {
				bindItemEvents(item);
			});
		} else {
			const el = createQcmElement();
			container.appendChild(el);
		}
	}

	reindexQcms();

	// Add QCM button handler
	if (addBtn) {
		const newAddBtn = addBtn.cloneNode(true);
		if (addBtn.parentNode) {
			addBtn.parentNode.replaceChild(newAddBtn, addBtn);
		}

		newAddBtn.addEventListener('click', () => {
			const el = createQcmElement();
			container.appendChild(el);
			reindexQcms();
			updateConfig();

			const newQuestionInput = el.querySelector('.roi_t1_question');
			if (newQuestionInput) {
				newQuestionInput.focus();
			}
		});
	}

	updateConfig();
}
