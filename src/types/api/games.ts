/**
 * Types pour l'endpoint REST /wp-json/roi/v1/games
 * Contrôleur: ROI\API\REST\Games_Controller
 */

import type { PgnString } from '../chess';

export interface SavedGame {
  id: number;
  title: string;
  date: string;
  member_id: number;
  difficulty_level: number;
  hints_count: number;
  takebacks_count: number;
  duration: number; // en secondes
  pgn: PgnString;
}

export interface SaveGameRequest {
  member_id: number;
  difficulty_level?: number;
  hints_count?: number;
  takebacks_count?: number;
  pgn: PgnString;
  duration?: number;
  game_date?: string;
}

export interface SaveGameResponse {
  success: boolean;
  id: number;
  message: string;
}

export interface GetGamesResponse {
  games: SavedGame[];
  total: number;
  total_pages: number;
  page: number;
  per_page: number;
}
