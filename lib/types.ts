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
] as const;

export const GAMES = [
  'Assetto Corsa',
  'Assetto Corsa Competizione',
  'Assetto Corsa EVO',
  'Assetto Corsa Rally',
  'Automobilista 2',
  'Beam.NG',
  'CarX',
  'Dirt Rally 2.0',
  'F1 25',
  'F1 24',
  'F1 23',
  'Forza Horizon 5',
  'Forza Motorsport 8',
  'Gran Turismo 7',
  'iRacing',
  'Le Mans Ultimate',
  'rFactor 2',
  'RaceRoom Racing Experience',
  'WRC',
] as const;

export type Wheelbase = typeof WHEELBASES[number];
export type Game = typeof GAMES[number];
