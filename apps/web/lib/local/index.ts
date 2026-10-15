export * from './paths';
export * from './types';
export * from './tauri';
export type { LocalUser } from './types';

/**
 * Operational data must eventually flow through this boundary.
 * The desktop runtime provides the native SQLite-backed implementations.
 */
export interface LocalServices {
  institutions: import('./types').InstitutionRepository;
  users: import('./types').LocalUserRepository;
}
