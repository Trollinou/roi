/**
 * Types pour l'endpoint REST /wp-json/roi/v1/contenu/<id>
 * Contrôleur: ROI\API\REST\Contenu_Controller
 */

import type { ExerciceConfig, ExerciceTypeId } from '../exercises';

export type ContenuPostType = 'roi_exercice' | 'roi_lecon' | 'roi_video';

export interface BaseContenuResponse {
  id: number;
  titre: string;
  post_type: ContenuPostType;
  chapitre_nom: string;
  chapitre_couleur: string;
  niveau: number;
  modified: string;
}

export interface ContenuExerciceResponse extends BaseContenuResponse {
  post_type: 'roi_exercice';
  type: ExerciceTypeId;
  config: ExerciceConfig | null;
}

export interface ContenuLeconResponse extends BaseContenuResponse {
  post_type: 'roi_lecon';
  contenu_html: string;
}

export interface ContenuVideoResponse extends BaseContenuResponse {
  post_type: 'roi_video';
  video_url: string;
  video_id: string;
  duree: string;
  contenu_html: string;
}

export type ContenuResponse =
  | ContenuExerciceResponse
  | ContenuLeconResponse
  | ContenuVideoResponse;
