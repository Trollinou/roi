/**
 * Admin Video Settings - YouTube oEmbed metadata & Duration detection
 */

document.addEventListener('DOMContentLoaded', () => {
	const urlInput = document.getElementById('roi_video_url');
	if (!urlInput) {
		return;
	}

	const idPreview = document.getElementById('roi_video_id_preview');
	const dureeInput = document.getElementById('roi_video_duree');
	const playerContainer = document.getElementById(
		'roi_video_player_container'
	);
	const statusNotice = document.getElementById('roi_video_fetch_status');
	const titleInput = document.getElementById('title');

	let ytPlayer = null;

	// Extraction Regex for YouTube ID (standard, short, embed)
	const extractYouTubeId = (url) => {
		if (!url) {
			return '';
		}
		const trimmed = url.trim();
		const match = trimmed.match(
			/(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
		);
		return match ? match[1] : '';
	};

	// Format seconds into MM:SS or HH:MM:SS
	const formatDuration = (seconds) => {
		const totalSec = Math.round(seconds);
		if (isNaN(totalSec) || totalSec <= 0) {
			return '';
		}

		const hrs = Math.floor(totalSec / 3600);
		const mins = Math.floor((totalSec % 3600) / 60);
		const secs = totalSec % 60;

		const pad = (n) => String(n).padStart(2, '0');

		if (hrs > 0) {
			return `${hrs}:${pad(mins)}:${pad(secs)}`;
		}
		return `${pad(mins)}:${pad(secs)}`;
	};

	// Load YouTube IFrame Player API if not already present
	let ytApiPromise = null;
	const ensureYouTubeApi = () => {
		if (window.YT && window.YT.Player) {
			return Promise.resolve();
		}
		if (ytApiPromise) {
			return ytApiPromise;
		}
		ytApiPromise = new Promise((resolve) => {
			const prevCallback = window.onYouTubeIframeAPIReady;
			window.onYouTubeIframeAPIReady = () => {
				if (typeof prevCallback === 'function') {
					prevCallback();
				}
				resolve();
			};

			if (!document.getElementById('youtube-iframe-api')) {
				const tag = document.createElement('script');
				tag.id = 'youtube-iframe-api';
				tag.src = 'https://www.youtube.com/iframe_api';
				const firstScriptTag =
					document.getElementsByTagName('script')[0];
				firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			}
		});
		return ytApiPromise;
	};

	// Initialize or reload YouTube player to read duration
	const initPlayer = async (videoId) => {
		if (!videoId || !playerContainer) {
			return;
		}

		await ensureYouTubeApi();

		// Empty container and create iframe mount point with full absolute dimensions
		playerContainer.innerHTML =
			'<div id="roi_yt_iframe_mount" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"></div>';

		if (ytPlayer && typeof ytPlayer.destroy === 'function') {
			try {
				ytPlayer.destroy();
			} catch (_e) {
				// ignore
			}
		}

		ytPlayer = new window.YT.Player('roi_yt_iframe_mount', {
			host: 'https://www.youtube-nocookie.com',
			height: '100%',
			width: '100%',
			videoId,
			playerVars: {
				playsinline: 1,
				rel: 0,
				modestbranding: 1,
			},
			events: {
				onReady: (event) => {
					try {
						const dur = event.target.getDuration();
						if (dur > 0 && dureeInput && !dureeInput.value) {
							dureeInput.value = formatDuration(dur);
						}
					} catch (_e) {
						// ignore
					}
				},
				onStateChange: (event) => {
					// Also detect duration on first play/cue
					if (
						event.data === window.YT.PlayerState.PLAYING ||
						event.data === window.YT.PlayerState.CUED
					) {
						try {
							const dur = event.target.getDuration();
							if (dur > 0 && dureeInput && !dureeInput.value) {
								dureeInput.value = formatDuration(dur);
							}
						} catch (_e) {
							// ignore
						}
					}
				},
			},
		});
	};

	// Fetch YouTube oEmbed metadata (Title, Author)
	const fetchOEmbedMetadata = async (url) => {
		if (!url) {
			return;
		}
		if (statusNotice) {
			statusNotice.textContent =
				'Récupération des informations YouTube...';
			statusNotice.style.display = 'inline-block';
		}

		try {
			const res = await fetch(
				`https://noembed.com/embed?url=${encodeURIComponent(url)}`
			);
			if (res.ok) {
				const data = await res.json();
				if (data && data.title) {
					// Pre-fill Title if empty
					if (
						titleInput &&
						(!titleInput.value || titleInput.value.trim() === '')
					) {
						titleInput.value = data.title;
					}
					if (statusNotice) {
						statusNotice.textContent = `Titre récupéré : "${data.title}"`;
						statusNotice.style.color = '#00701c';
					}
				} else if (statusNotice) {
					statusNotice.style.display = 'none';
				}
			}
		} catch (_e) {
			if (statusNotice) {
				statusNotice.style.display = 'none';
			}
		}
	};

	// Handle input changes
	let debounceTimer = null;
	const onUrlChanged = () => {
		const val = urlInput.value.trim();
		const videoId = extractYouTubeId(val);

		if (idPreview) {
			idPreview.textContent = videoId || 'Aucun';
		}

		if (videoId) {
			initPlayer(videoId);
			fetchOEmbedMetadata(val);
		} else if (playerContainer) {
			playerContainer.innerHTML =
				'<div style="position: absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#888;">Collez une URL YouTube valide pour afficher l\'aperçu.</div>';
		}
	};

	urlInput.addEventListener('input', () => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(onUrlChanged, 500);
	});

	urlInput.addEventListener('paste', () => {
		setTimeout(onUrlChanged, 100);
	});

	// If a video ID exists on initial page load, init player to detect duration if missing
	const initialVideoId = extractYouTubeId(urlInput.value);
	if (initialVideoId) {
		initPlayer(initialVideoId);
	}
});
