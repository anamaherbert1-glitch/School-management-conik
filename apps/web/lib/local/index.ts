export * from './paths';
export * from './types';

/**
 * Operational data must eventually flow through this boundary.
 * The first adapter is intentionally not tied to Supabase so that
 * the desktop runtime can provide SQLite-backed implementations.
 */
export interface LocalServices {
  institutions: import('./types').InstitutionRepository;
  users: import('./types').LocalUserRepository;
}
