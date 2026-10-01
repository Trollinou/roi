/**
 * Helpers for Type 14 Options & Propositions Rendering.
 */

export function renderOptionsReponseList(
	optionsReponse,
	{ onOptionChange, onOptionDelete }
) {
	const listContainer = document.getElementById(
		'roi_t14_options_reponse_list'
	);
	if (!listContainer) {
		return;
	}

	listContainer.innerHTML = '';

	optionsReponse.forEach((optText, optIdx) => {
		const itemDiv = document.createElement('div');
		itemDiv.style.display = 'inline-flex';
		itemDiv.style.gap = '4px';
		itemDiv.style.alignItems = 'center';
		itemDiv.style.background = '#fff';
		itemDiv.style.border = '1px solid #ccd0d4';
		itemDiv.style.borderRadius = '4px';
		itemDiv.style.padding = '3px 6px';

		const input = document.createElement('input');
		input.type = 'text';
		input.value = optText;
		input.placeholder = `Option ${optIdx + 1}`;
		input.style.width = '100px';
		input.style.height = '28px';
		input.style.fontSize = '12px';

		input.addEventListener('input', () => {
			if (onOptionChange) {
				onOptionChange(optIdx, input.value);
			}
		});

		const btnDelete = document.createElement('button');
		btnDelete.type = 'button';
		btnDelete.className = 'button button-link-delete';
		btnDelete.style.padding = '0 4px';
		btnDelete.innerHTML =
			'<span class="dashicons dashicons-trash" style="font-size:16px; width:16px; height:16px;"></span>';
		btnDelete.title = 'Supprimer cette option';

		btnDelete.addEventListener('click', () => {
			if (optionsReponse.length <= 1) {
				return;
			}
			if (onOptionDelete) {
				onOptionDelete(optIdx);
			}
		});

		itemDiv.appendChild(input);
		itemDiv.appendChild(btnDelete);
		listContainer.appendChild(itemDiv);
	});
}

export function renderSingleReponseContainers(
	optionsReponse,
	exercices,
	onAnswerChange
) {
	for (let i = 0; i < 5; i++) {
		const container = document.querySelector(
			`.roi_t14_single_reponse_container[data-index="${i}"]`
		);
		if (!container) {
			continue;
		}

		container.innerHTML = '';
		const currentVal = exercices[i].reponse_oui_non;

		optionsReponse.forEach((optText, optIdx) => {
			const label = document.createElement('label');
			label.style.display = 'flex';
			label.style.alignItems = 'center';
			label.style.gap = '6px';
			label.style.cursor = 'pointer';
			label.style.fontWeight = '600';
			label.style.fontSize = '13px';

			const isFirst = optIdx === 0;
			const isSecond = optIdx === 1;
			if (
				optText === 'OUI' ||
				(isFirst && (optText === '' || optText === 'OUI'))
			) {
				label.style.color = '#198754';
			} else if (
				optText === 'NON' ||
				(isSecond && (optText === '' || optText === 'NON'))
			) {
				label.style.color = '#dc3545';
			} else {
				label.style.color = '#1d2327';
			}

			let isChecked = false;
			if (typeof currentVal === 'boolean') {
				isChecked =
					(currentVal && optIdx === 0) ||
					(!currentVal && optIdx === 1);
			} else if (typeof currentVal === 'string') {
				isChecked =
					currentVal === optText ||
					(optIdx === 0 && currentVal === '1') ||
					(optIdx === 1 && currentVal === '0');
			} else if (typeof currentVal === 'number') {
				isChecked = currentVal === optIdx;
			}

			const radio = document.createElement('input');
			radio.type = 'radio';
			radio.name = `roi_t14_reponse_oui_non_${i}`;
			radio.value = optText || `option_${optIdx}`;
			radio.checked = isChecked;

			radio.addEventListener('change', () => {
				let finalVal = optText;
				if (
					optionsReponse.length === 2 &&
					optionsReponse[0] === 'OUI' &&
					optionsReponse[1] === 'NON'
				) {
					finalVal = optIdx === 0;
				}
				if (onAnswerChange) {
					onAnswerChange(i, finalVal);
				}
			});

			const span = document.createElement('span');
			span.textContent = optText || `Option ${optIdx + 1}`;

			label.appendChild(radio);
			label.appendChild(span);
			container.appendChild(label);
		});
	}
}

export function renderMultipleReponsesContainers(
	propositions,
	optionsReponse,
	exercices,
	onMultipleAnswerChange
) {
	for (let i = 0; i < 5; i++) {
		const container = document.querySelector(
			`.roi_t14_multiple_reponses_container[data-index="${i}"]`
		);
		if (!container) {
			continue;
		}

		container.innerHTML = '';

		if (propositions.length === 0) {
			const emptyMsg = document.createElement('div');
			emptyMsg.style.color = '#787c82';
			emptyMsg.style.fontStyle = 'italic';
			emptyMsg.style.fontSize = '12px';
			emptyMsg.textContent =
				'Aucune proposition définie pour le moment. Ajoutez des propositions ci-dessus.';
			container.appendChild(emptyMsg);
			continue;
		}

		propositions.forEach((propText, propIdx) => {
			const row = document.createElement('div');
			row.style.display = 'flex';
			row.style.alignItems = 'center';
			row.style.justifyContent = 'space-between';
			row.style.background = '#fff';
			row.style.border = '1px solid #ccd0d4';
			row.style.borderRadius = '4px';
			row.style.padding = '6px 12px';

			const label = document.createElement('span');
			label.style.fontSize = '13px';
			label.style.fontWeight = '500';
			label.textContent = propText || `Proposition ${propIdx + 1}`;

			const radiosDiv = document.createElement('div');
			radiosDiv.style.display = 'flex';
			radiosDiv.style.gap = '12px';
			radiosDiv.style.alignItems = 'center';

			const currentAns = Array.isArray(exercices[i].reponses_multiple)
				? exercices[i].reponses_multiple[propIdx]
				: undefined;

			optionsReponse.forEach((optText, optIdx) => {
				const optLabel = document.createElement('label');
				optLabel.style.cursor = 'pointer';
				optLabel.style.fontWeight = '600';
				optLabel.style.fontSize = '12px';

				if (
					optText === 'OUI' ||
					(optIdx === 0 && (optText === '' || optText === 'OUI'))
				) {
					optLabel.style.color = '#198754';
				} else if (
					optText === 'NON' ||
					(optIdx === 1 && (optText === '' || optText === 'NON'))
				) {
					optLabel.style.color = '#dc3545';
				} else {
					optLabel.style.color = '#1d2327';
				}

				let isChecked = false;
				if (typeof currentAns === 'boolean') {
					isChecked =
						(currentAns && optIdx === 0) ||
						(!currentAns && optIdx === 1);
				} else if (typeof currentAns === 'string') {
					isChecked =
						currentAns === optText ||
						(optIdx === 0 && currentAns === '1') ||
						(optIdx === 1 && currentAns === '0');
				} else if (typeof currentAns === 'number') {
					isChecked = currentAns === optIdx;
				} else if (typeof currentAns === 'undefined' && optIdx === 0) {
					isChecked = true;
				}

				const radio = document.createElement('input');
				radio.type = 'radio';
				radio.name = `roi_t14_prop_ans_${i}_${propIdx}`;
				radio.value = optText || `option_${optIdx}`;
				radio.checked = isChecked;

				radio.addEventListener('change', () => {
					let finalVal = optText;
					if (
						optionsReponse.length === 2 &&
						optionsReponse[0] === 'OUI' &&
						optionsReponse[1] === 'NON'
					) {
						finalVal = optIdx === 0;
					}
					if (onMultipleAnswerChange) {
						onMultipleAnswerChange(i, propIdx, finalVal);
					}
				});

				const span = document.createElement('span');
				span.textContent = optText || `Option ${optIdx + 1}`;

				optLabel.appendChild(radio);
				optLabel.appendChild(document.createTextNode(' '));
				optLabel.appendChild(span);
				radiosDiv.appendChild(optLabel);
			});

			row.appendChild(label);
			row.appendChild(radiosDiv);
			container.appendChild(row);
		});
	}
}

export function renderPropositionsList(
	propositions,
	{ onPropositionChange, onPropositionDelete }
) {
	const listContainer = document.getElementById('roi_t14_propositions_list');
	if (!listContainer) {
		return;
	}

	listContainer.innerHTML = '';

	propositions.forEach((propText, propIdx) => {
		const itemDiv = document.createElement('div');
		itemDiv.style.display = 'flex';
		itemDiv.style.gap = '8px';
		itemDiv.style.alignItems = 'center';

		const input = document.createElement('input');
		input.type = 'text';
		input.value = propText;
		input.placeholder = `ex: Petit roque blanc (0-0) ?`;
		input.style.flex = '1';
		input.style.height = '30px';

		input.addEventListener('input', () => {
			if (onPropositionChange) {
				onPropositionChange(propIdx, input.value);
			}
		});

		const btnDelete = document.createElement('button');
		btnDelete.type = 'button';
		btnDelete.className = 'button button-link-delete';
		btnDelete.innerHTML = '<span class="dashicons dashicons-trash"></span>';
		btnDelete.title = 'Supprimer cette proposition';

		btnDelete.addEventListener('click', () => {
			if (onPropositionDelete) {
				onPropositionDelete(propIdx);
			}
		});

		itemDiv.appendChild(input);
		itemDiv.appendChild(btnDelete);
		listContainer.appendChild(itemDiv);
	});
}
