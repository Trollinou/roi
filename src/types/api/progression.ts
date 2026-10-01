/**
 * Types pour les endpoints REST /wp-json/roi/v1/progression/*
 * Contrôleur: ROI\API\REST\Progression_Controller
 */

export interface ProgressionDetail {
  date: string;
  time_spent?: number | null;
  attempts?: number | null;
  source?: string;
}

export type IdentityType = 'user' | 'member' | 'parent' | 'admin';

export interface StudentParentUser {
  id: number;
  display_name: string;
}

export interface StudentGroupSummary {
  id: number;
  name: string;
  slug: string;
}

export interface StudentProgress {
  id: string; // Ex: "12__roi_element_valide_member_45"
  display_id: number;
  identity_type: IdentityType;
  parent_user: StudentParentUser | null;
  nom: string;
  prenom: string;
  display_name: string;
  groups: StudentGroupSummary[];
  assigned_course_ids: number[];
  elements_valides: number[];
  details: Record<number, ProgressionDetail>;
}

export interface CandidateStudent {
  id: number;
  type: 'adherent';
  nom: string;
  prenom: string;
  display_name: string;
  email: string;
  birth_date: string;
  legal_rep: string;
}

export interface StudentGroupTaxonomy {
  id: number;
  name: string;
  slug: string;
  count: number;
}

// Payloads de requêtes
export interface EnregistrerProgressionRequest {
  student_id?: string | number;
  course_id?: number;
  element_id?: number;
  element_ids?: number[];
  time_spent?: number;
  attempts?: number;
}

export interface EnregistrerProgressionResponse {
  success: boolean;
  validated_count: number;
  message: string;
}

export interface ResetProgressionRequest {
  student_id: string | number;
  course_id?: number;
  element_id?: number;
}

export interface ResetProgressionResponse {
  success: boolean;
  message: string;
}

export interface AjouterEleveRequest {
  adherent_id: number;
}

export interface AjouterEleveResponse {
  success: boolean;
  student: StudentProgress;
}

export interface RetirerEleveRequest {
  student_id: string;
}

export interface RetirerEleveResponse {
  success: boolean;
  message: string;
}

export interface AssignerCoursRequest {
  adherent_id: number;
  cours_id: number;
  action?: 'assign' | 'unassign';
}

export interface AssignerCoursResponse {
  success: boolean;
  message: string;
  cours_id: number;
  adherent_id: number;
  target_members: number[];
}
