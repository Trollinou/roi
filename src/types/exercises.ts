/**
 * Définitions et typage des 16 types d'exercices ROI.
 */

import type { FenString, PgnString, Square } from './chess';

export type ExerciceTypeId =
  | 1  // 100 Commandements
  | 2  // Pop'Echecs
  | 3  // ABCDaire Tactique
  | 4  // Partie dont tu es le Héros
  | 5  // Posi'Plan
  | 6  // Associ'Plan
  | 7  // Marche du Héros
  | 8  // Vision'checs
  | 9  // Parcours
  | 10 // Echec'éval
  | 11 // Class'échecs
  | 12 // Qui-suis-je ?
  | 13 // Ouvre'boite
  | 14 // Cap ou pas cap ?
  | 15 // Jugement final
  | 16; // Destination finale

export type ExerciceNiveauId = 1 | 2 | 3 | 4;

export interface BaseExerciceConfig {
  type: ExerciceTypeId;
  consigne?: string;
  [key: string]: unknown;
}

// Type 1: 100 Commandements
export interface QcmItem {
  question: string;
  reponses: string[];
  bonne_reponse: number;
}

export interface ExerciceType1Config extends BaseExerciceConfig {
  type: 1;
  consigne?: string;
  qcms: QcmItem[];
}

// Type 2: Pop'Echecs
export interface ExerciceType2Config extends BaseExerciceConfig {
  type: 2;
  fen: FenString;
  questions?: Array<{
    id: string;
    label: string;
    points?: number;
  }>;
}

// Type 3: ABCDaire Tactique
export interface ExerciceType3Config extends BaseExerciceConfig {
  type: 3;
  fen: FenString;
  solution_pgn?: PgnString;
  theme?: string;
}

// Type 4: Partie dont tu es le Héros
export interface ExerciceType4Config extends BaseExerciceConfig {
  type: 4;
  pgn: PgnString;
  orientation?: 'white' | 'black';
  intro_text?: string;
}

// Type 5: Posi'Plan
export interface ExerciceType5Config extends BaseExerciceConfig {
  type: 5;
  fen: FenString;
  plans?: Array<{
    id: string;
    titre: string;
    correct: boolean;
    explication?: string;
  }>;
}

// Type 6: Associ'Plan
export interface ExerciceType6Config extends BaseExerciceConfig {
  type: 6;
  paires?: Array<{
    position_fen: FenString;
    plan_id: string;
    label: string;
  }>;
}

// Type 7: Marche du Héros
export interface ExerciceType7Config extends BaseExerciceConfig {
  type: 7;
  fen: FenString;
  target_square?: Square;
  max_moves?: number;
}

// Type 8: Vision'checs
export interface ExerciceType8Config extends BaseExerciceConfig {
  type: 8;
  fen: FenString;
  cases_cibles?: Square[];
  temps_affichage_secondes?: number;
}

// Type 9: Parcours
export interface ExerciceType9Config extends BaseExerciceConfig {
  type: 9;
  fen: FenString;
  checkpoint_squares?: Square[];
}

// Type 10: Echec'éval
export interface ExerciceType10Config extends BaseExerciceConfig {
  type: 10;
  fen: FenString;
  evaluation_attendue?: 'gagne_blanc' | 'gagne_noir' | 'nulle' | 'avantage_blanc' | 'avantage_noir';
}

// Type 11: Class'échecs
export interface ExerciceType11Config extends BaseExerciceConfig {
  type: 11;
  categories?: Array<{
    id: string;
    nom: string;
  }>;
  items?: Array<{
    id: string;
    label: string;
    category_id: string;
    fen?: FenString;
  }>;
}

// Type 12: Qui-suis-je ?
export type QuiSuisJeVariante = 'pieces' | 'cases';

export interface ExerciceType12Config extends BaseExerciceConfig {
  type: 12;
  variante: QuiSuisJeVariante;
  indices?: string[];
  reponse?: string;
}

// Type 13: Ouvre'boite
export interface ExerciceType13Config extends BaseExerciceConfig {
  type: 13;
  fen: FenString;
  coups_cibles?: string[];
}

// Type 14: Cap ou pas cap ?
export type CapOuPasCapVariante =
  | 'qcm_multiple'
  | 'qcm_oui_non'
  | 'move'
  | 'notation'
  | 'clic'
  | 'setup';

export interface ExerciceType14Config extends BaseExerciceConfig {
  type: 14;
  variante: CapOuPasCapVariante;
  fen?: FenString;
  type_reponse?: CapOuPasCapVariante;
  mode_clic?: 'cibles' | 'materiel' | 'prises_meilleur_coup';
  mode_setup?: 'memoire' | 'texte';
  cases_valides?: Square[];
  solution_coup?: string;
  options_qcm?: string[];
  bonne_reponse_qcm?: string | number;
}

// Type 15: Jugement final
export interface ExerciceType15Config extends BaseExerciceConfig {
  type: 15;
  fen: FenString;
  verdict_correct?: string;
}

// Type 16: Destination finale
export interface ExerciceType16Config extends BaseExerciceConfig {
  type: 16;
  fen: FenString;
  piece_depart?: Square;
  destination_attendue?: Square;
}

/**
 * Union discriminée de toutes les configurations d'exercices possibles.
 */
export type ExerciceConfig =
  | ExerciceType1Config
  | ExerciceType2Config
  | ExerciceType3Config
  | ExerciceType4Config
  | ExerciceType5Config
  | ExerciceType6Config
  | ExerciceType7Config
  | ExerciceType8Config
  | ExerciceType9Config
  | ExerciceType10Config
  | ExerciceType11Config
  | ExerciceType12Config
  | ExerciceType13Config
  | ExerciceType14Config
  | ExerciceType15Config
  | ExerciceType16Config
  | BaseExerciceConfig;
