export const CHAPTER_COLOR_MAP: Record<string, string> = {
  primary: '#0073aa',
  warning: '#d94f00',
  danger: '#d63638',
  success: '#00a32a',
  tertiary: '#8224e3',
};

export const CHAPTER_ORDER_MAP: Record<string, number> = {
  Matérialité: 1,
  'Activité des Pièces': 2,
  'Sécurité du Roi': 3,
  'Structure de Pions': 4,
  Combination: 5,
};

export const normalizeText = (str: string | null | undefined): string =>
  (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function formatDuration(seconds: number | null | undefined): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
    return '-';
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins > 0 ? `${mins}m ` : ''}${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  if (mins > 0) {
    return `${mins} min ${secs > 0 ? `${secs}s` : ''}`.trim();
  }
  return `${secs}s`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return '-';
  }
  try {
    const date = new Date(dateString.replace(' ', 'T'));
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}
