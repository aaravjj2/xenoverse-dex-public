/**
 * Xenoverse Dex TypeScript Definitions
 * Generated: 2026-01-29T23:18:06.205Z
 * Schema Version: 1.0.0
 */

// Type enum
export type PokemonType = 'BUG' | 'DARK' | 'DRAGON' | 'ELECTRIC' | 'FAIRY' | 'FIGHTING' | 'FIRE' | 'FLYING' | 'GHOST' | 'GRASS' | 'GROUND' | 'ICE' | 'NORMAL' | 'POISON' | 'PSYCHIC' | 'QMARKS' | 'ROCK' | 'SOUND' | 'STEEL' | 'WATER';

// Move category
export type MoveCategory = 'Physical' | 'Special' | 'Status';

// Stats
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

// Species
export interface Species {
  id: string;
  form_id: number;
  name: string;
  form_name: string | null;
  type1: PokemonType;
  type2: PokemonType | null;
  stats: Stats;
  bst: number;
  ability1: string | null;
  ability2: string | null;
  hidden_ability: string | null;
  egg_group1: string | null;
  egg_group2: string | null;
  growth_rate: string | null;
  catch_rate: number | null;
  base_exp: number | null;
  has_evolutions: boolean;
  has_learnset: boolean;
}

// Move
export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  target: string | null;
  description: string | null;
}

// Evolution
export interface Evolution {
  species_id: string;
  form_id: number;
  target_species: string;
  target_form: number;
  method: string | null;
  param: string | null;
}

// Learnset Entry
export interface LearnsetEntry {
  species_id: string;
  form_id: number;
  move_id: string;
  learn_method: 'level_up' | 'tm' | 'tutor' | 'egg' | 'special';
  level: number | null;
}

// Type
export interface Type {
  id: PokemonType;
  name: string;
  is_pseudo_type: boolean;
  is_special_type: boolean;
  weaknesses: PokemonType[];
  resistances: PokemonType[];
  immunities: PokemonType[];
}

// Ability
export interface Ability {
  id: string;
  name: string;
  description: string | null;
}

// Type IDs
export const TypeIds = ['BUG', 'DARK', 'DRAGON', 'ELECTRIC', 'FAIRY', 'FIGHTING', 'FIRE', 'FLYING', 'GHOST', 'GRASS', 'GROUND', 'ICE', 'NORMAL', 'POISON', 'PSYCHIC', 'QMARKS', 'ROCK', 'SOUND', 'STEEL', 'WATER'] as const;

// Ability count
export const AbilityCount = 347;

// Schema version
export const SchemaVersion = '1.0.0';
