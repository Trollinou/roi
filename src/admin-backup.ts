document.addEventListener('DOMContentLoaded', () => {
	const restoreForm = document.getElementById(
		'roi-restore-form'
	) as HTMLFormElement | null;
	if (restoreForm) {
		restoreForm.addEventListener('submit', (e: Event) => {
			const confirmMessage =
				restoreForm.getAttribute('data-confirm-message') ||
				'Êtes-vous sûr de vouloir restaurer cette sauvegarde ?';
			if (!window.confirm(confirmMessage)) {
				e.preventDefault();
			}
		});
	}
});
