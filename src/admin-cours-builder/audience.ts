/**
 * Normalizes string by removing accents and lowercasing for search comparison.
 *
 * @param str The string to normalize.
 * @return The normalized string.
 */
function normalizeText(str: string): string {
	return (str || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

/**
 * Initializes Audience metabox interactions (toggle restricted view, live filtering).
 */
export function initAudienceMetabox(): void {
	const restrictedContainer = document.getElementById(
		'roi-audience-restricted-container'
	);
	const audienceRadios = document.querySelectorAll<HTMLInputElement>(
		'input[name="roi_cours_audience_type"]'
	);

	if (audienceRadios.length > 0 && restrictedContainer) {
		audienceRadios.forEach((radio) => {
			radio.addEventListener('change', () => {
				restrictedContainer.style.display =
					radio.value === 'restricted' ? 'block' : 'none';
			});
		});
	}

	const filterInput = document.getElementById(
		'roi_audience_member_filter'
	) as HTMLInputElement | null;
	const memberItems = document.querySelectorAll<HTMLElement>(
		'#roi_audience_members_list li'
	);

	if (filterInput && memberItems.length > 0) {
		filterInput.addEventListener('input', () => {
			const filter = normalizeText(filterInput.value);
			memberItems.forEach((item) => {
				const text = normalizeText(item.textContent || '');
				item.style.display = text.includes(filter) ? '' : 'none';
			});
		});

		filterInput.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				e.preventDefault();
			}
		});
	}
}
