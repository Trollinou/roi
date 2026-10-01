/**
 * Types pour l'endpoint REST /wp-json/roi/v1/parcours
 * Contrôleur: ROI\API\REST\Parcours_Controller
 */

export interface PlaylistItem {
  id: number;
  type?: string;
  titre?: string;
  modified?: string;
  [key: string]: unknown;
}

export type CourseAudienceType = 'all' | 'restricted';

export interface CoursItem {
  id: number;
  titre: string;
  niveau: number;
  playlist: PlaylistItem[];
  chapitre_nom: string;
  chapitre_couleur: string;
  ordre: number;
  audience_type: CourseAudienceType;
  target_groups: number[];
  target_members: number[];
  is_assigned: boolean;
  unlocked_by_assignment: boolean;
}

export type ParcoursResponse = CoursItem[];
