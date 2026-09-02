import type { Institution } from './types';

export interface LocalRuntimeStatus {
  initialized: boolean;
  database_path: string;
  root_path: string;
  migration_version: number | null;
}

export interface CreateInstitutionInput {
  name: string;
  slug: string;
  country_code?: string;
  timezone?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_path?: string;
  academic_year_label?: string;
}

export interface NativeInstitution {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  timezone: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_path?: string;
  academic_year_label?: string;
  created_at: string;
  updated_at: string;
}

const unavailable = () =>
  new Error('CONIK desktop runtime is not available in the current web browser.');

export function isDesktopRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export const LOCAL_INSTITUTION_ID_KEY = 'conik.local.institution.id';

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (typeof window === 'undefined' || !isDesktopRuntime()) throw unavailable();

  try {
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    return tauriInvoke<T>(command, args);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(String(error));
  }
}

export const localRuntime = {
  initialize(): Promise<LocalRuntimeStatus> {
    return invoke('initialize_local_runtime');
  },

  status(): Promise<LocalRuntimeStatus> {
    return invoke('get_local_runtime_status');
  },

  createInstitution(input: CreateInstitutionInput): Promise<NativeInstitution> {
    return invoke('create_institution', input);
  },

  getInstitution(id: string): Promise<NativeInstitution | null> {
    return invoke('get_institution', { id });
  },
};

export function nativeInstitutionToDomain(input: NativeInstitution): Institution {
  return {
    id: input.id,
    name: input.name,
    slug: input.slug,
    countryCode: input.country_code,
    timezone: input.timezone,
    address: input.address,
    city: input.city,
    phone: input.phone,
    email: input.email,
    website: input.website,
    logoPath: input.logo_path,
    academicYearLabel: input.academic_year_label,
    createdAt: input.created_at,
    updatedAt: input.updated_at,
  };
}
