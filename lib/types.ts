export interface Preset {
  id: string;
  name: string;
  wheelbase: string;
  game: string;
  description: string | null;
  file_path: string;
  original_filename: string;
  downloads: number;
  images: string[];
  created_at: string;
  avg_rating?: number;
  rating_count?: number;
}

export interface Rating {
  id: string;
  preset_id: string;
  rating: number;
  fingerprint: string;
  created_at: string;
}

export const WHEELBASES = [
  'R3',
  'R5',
  'R9',
  'R12',
  'R16',
  'R21',
  'GS',
] as const;

export const GAMES = [
  'Assetto Corsa',
  'Assetto Corsa Competizione',
  'iRacing',
  'Gran Turismo 7',
  'F1 25',
  'F1 24',
  'F1 23',
  'rFactor 2',
  'Automobilista 2',
  'WRC',
  'Dirt Rally 2.0',
  'RaceRoom Racing Experience',
  'Le Mans Ultimate',
] as const;

export type Wheelbase = typeof WHEELBASES[number];
export type Game = typeof GAMES[number];
