export interface LocalLevel {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  description?: string;
  sequence: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LocalDepartment {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const unavailable = () => new Error('CONIK desktop runtime is not available in the current web browser.');

function isDesktopRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isDesktopRuntime()) throw unavailable();
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

export const localCatalog = {
  createLevel: (input: { institution_id: string; name: string; code: string; description?: string; sequence: number }) =>
    invoke<LocalLevel>('create_level', input),
  listLevels: (institution_id: string) => invoke<LocalLevel[]>('list_levels', { institution_id }),
  createDepartment: (input: { institution_id: string; name: string; code: string; description?: string }) =>
    invoke<LocalDepartment>('create_department', input),
  listDepartments: (institution_id: string) => invoke<LocalDepartment[]>('list_departments', { institution_id }),
};
