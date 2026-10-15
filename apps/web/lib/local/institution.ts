'use client'
import { LOCAL_INSTITUTION_ID_KEY, localRuntime } from './tauri'

/** Returns the local institution id saved by onboarding, after initializing the SQLite runtime. */
export async function getLocalInstitutionId(): Promise<string | null> {
  await localRuntime.initialize()
  const id = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_INSTITUTION_ID_KEY) : null
  if (!id) return null
  const institution = await localRuntime.getInstitution(id)
  return institution ? institution.id : null
}

/** Normalizes errors thrown by Tauri commands ({code,message}) or JS errors into a readable message. */
export function localErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  if (typeof err === 'string') return err
  return 'Une erreur est survenue.'
}
