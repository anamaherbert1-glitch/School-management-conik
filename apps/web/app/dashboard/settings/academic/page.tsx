'use client'

import { useCallback, useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { academicSections } from './data'
import { createClient } from '@/lib/supabase/client'

type Section = (typeof academicSections)[number]
type Item = { id: string; name: string; code?: string | null }

const tableFor: Partial<Record<Section, string>> = {
  Départements: 'departments',
  Niveaux: 'levels',
  Filières: 'programs',
  Matières: 'subjects',
  'Classes / groupes': 'class_groups',
  Salles: 'rooms',
  Enseignants: 'teachers',
}

const labelFor: Record<string, string> = {
  departments: 'département',
  levels: 'niveau',
  programs: 'filière',
  subjects: 'matière',
  class_groups: 'classe / groupe',
  rooms: 'salle',
  teachers: 'enseignant',
}

export default function AcademicSettingsPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [active, setActive] = useState<Section>('Départements')
  const [items, setItems] = useState<Item[]>([])
  const [levels, setLevels] = useState<Item[]>([])
  const [subjects, setSubjects] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [programId, setProgramId] = useState('')
  const [levelId, setLevelId] = useState('')
  const [semester, setSemester] = useState(1)
  const [subjectIds, setSubjectIds] = useState<string[]>([])

  useEffect(() => {
    try {
      setSupabase(createClient())
    } catch {
      setMessage('Configuration Supabase manquante. Ajoutez les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    }
  }, [])

  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    const loadOrganization = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (cancelled) return
      if (authError || !user) {
        setMessage('Connectez-vous pour gérer la configuration.')
        return
      }
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      if (cancelled) return
      if (error) setMessage(error.message)
      else if (!data) setMessage('Aucun établissement n’est associé à votre compte.')
      else setOrganizationId(data.organization_id)
    }
    void loadOrganization()
    return () => { cancelled = true }
  }, [supabase])

  const loadItems = useCallback(async () => {
    if (!supabase || !organizationId) return
    const table = tableFor[active]
    if (!table) return
    setLoading(true)
    const { data, error } = await supabase
      .from(table)
      .select('id,name,code')
      .eq('organization_id', organizationId)
      .order('name')
    if (error) setMessage(error.message)
    else setItems((data ?? []) as Item[])
    setLoading(false)
  }, [active, organizationId, supabase])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  useEffect(() => {
    if (!supabase || !organizationId) return
    let cancelled = false
    const loadBuilderData = async () => {
      const [{ data: programs, error: programsError }, { data: lv, error: levelsError }, { data: sb, error: subjectsError }] = await Promise.all([
        supabase.from('programs').select('id,name').eq('organization_id', organizationId).order('name'),
        supabase.from('levels').select('id,name,code').eq('organization_id', organizationId).order('ordinal'),
        supabase.from('subjects').select('id,name,code').eq('organization_id', organizationId).order('name'),
      ])
      if (cancelled) return
      const error = programsError ?? levelsError ?? subjectsError
      if (error) setMessage(error.message)
      setLevels((lv ?? []) as Item[])
      setSubjects((sb ?? []) as Item[])
      if (!programId && programs?.[0]) setProgramId(programs[0].id)
      if (!levelId && lv?.[0]) setLevelId(lv[0].id)
    }
    void loadBuilderData()
    return () => { cancelled = true }
  }, [organizationId, programId, levelId, supabase])

  const addItem = async () => {
    if (!supabase || !organizationId) return
    const table = tableFor[active]
    if (!table) return
    const name = window.prompt(`Nom du ${labelFor[table] ?? 'élément'}`)?.trim()
    if (!name) return
    const code = window.prompt('Code (optionnel)')?.trim() || null
    setLoading(true)
    let payload: Record<string, unknown> = { organization_id: organizationId, name, code }
    if (table === 'levels') payload = { ...payload, ordinal: Number(window.prompt('Ordre du niveau (1=L1, 2=L2...)') || 1) }
    if (table === 'subjects') payload = { ...payload, credits: Number(window.prompt('Crédits (optionnel)') || 0), coefficient: Number(window.prompt('Coefficient (optionnel)') || 1) }
    if (table === 'teachers') {
      const firstName = window.prompt('Prénom')?.trim()
      const lastName = window.prompt('Nom')?.trim()
      if (!firstName || !lastName) { setLoading(false); return }
      payload = { organization_id: organizationId, first_name: firstName, last_name: lastName, employee_number: code }
      delete payload.name
    }
    const { error } = await supabase.from(table).insert(payload)
    if (error) setMessage(error.message)
    else { setMessage(`${name} a été enregistré dans Supabase.`); await loadItems() }
    setLoading(false)
  }

  const removeItem = async (id: string) => {
    if (!supabase || !organizationId) return
    const table = tableFor[active]
    if (!table || !window.confirm('Supprimer cet élément ?')) return
    setLoading(true)
    const { error } = await supabase.from(table).delete().eq('id', id).eq('organization_id', organizationId)
    if (error) setMessage(error.message)
    else { setMessage('Élément supprimé.'); await loadItems() }
    setLoading(false)
  }

  const toggleSubject = (id: string) => {
    setSubjectIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const saveProgram = async () => {
    if (!supabase || !organizationId || !programId || !levelId || !subjectIds.length) {
      setMessage('Sélectionnez une filière, un niveau et au moins une matière.')
      return
    }
    const rows = subjectIds.map((subject_id, index) => ({
      organization_id: organizationId,
      program_id: programId,
      level_id: levelId,
      semester_number: semester,
      subject_id,
      display_order: index + 1,
      is_required: true,
    }))
    setLoading(true)
    const { error } = await supabase
      .from('program_subjects')
      .upsert(rows, { onConflict: 'program_id,level_id,semester_number,subject_id' })
    if (error) setMessage(error.message)
    else setMessage('Programme enregistré dans Supabase.')
    setLoading(false)
  }

  return (
    <main className="academic-settings">
      <header>
        <p className="eyebrow">CONIK · CONFIGURATION</p>
        <h1>Configuration de l’établissement</h1>
        <p>Les données sont lues et enregistrées dans Supabase.</p>
      </header>

      <nav className="settings-nav" aria-label="Configuration académique">
        {academicSections.map((section) => (
          <button key={section} type="button" className={active === section ? 'active' : ''} onClick={() => { setActive(section); setMessage('') }}>
            {section}
          </button>
        ))}
      </nav>

      <section className="settings-card">
        <div className="section-head">
          <div>
            <h2>{active}</h2>
            <p>{active === 'Programmes' ? 'Construisez le programme semestre par semestre.' : `${items.length} élément(s)`}</p>
          </div>
          {tableFor[active] && <button type="button" className="primary" onClick={addItem} disabled={loading}>+ Ajouter</button>}
        </div>

        {active === 'Programmes' ? (
          <div className="program-builder">
            <div className="selectors">
              <label>Filière
                <select value={programId} onChange={(event) => setProgramId(event.target.value)}>
                  <option value="">Sélectionner une filière</option>
                  {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>Niveau
                <select value={levelId} onChange={(event) => setLevelId(event.target.value)}>
                  <option value="">Sélectionner un niveau</option>
                  {levels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label>Semestre
                <select value={semester} onChange={(event) => setSemester(Number(event.target.value))}>
                  {Array.from({ length: 6 }, (_, index) => <option key={index + 1} value={index + 1}>Semestre {index + 1}</option>)}
                </select>
              </label>
            </div>

            <div className="semester">
              <h3>Matières du semestre</h3>
              {!subjects.length && <p>Aucune matière disponible. Créez d’abord vos matières.</p>}
              {subjects.map((subject) => (
                <label key={subject.id}>
                  <input type="checkbox" checked={subjectIds.includes(subject.id)} onChange={() => toggleSubject(subject.id)} />
                  {subject.name}{subject.code && <small> · {subject.code}</small>}
                </label>
              ))}
            </div>
            <button type="button" className="primary" onClick={saveProgram} disabled={loading}>Enregistrer le programme</button>
          </div>
        ) : (
          <div className="items-list">
            {loading && <p>Chargement…</p>}
            {items.map((item) => (
              <div className="item" key={item.id}>
                <div><strong>{item.name}</strong>{item.code && <small>{item.code}</small>}</div>
                <button type="button" className="delete" onClick={() => removeItem(item.id)}>Supprimer</button>
              </div>
            ))}
            {!loading && !items.length && <div className="empty-state"><h3>Aucun élément</h3><p>Ajoutez le premier élément.</p></div>}
          </div>
        )}

        {message && <div className="toast" role="status">✓ {message}</div>}
      </section>

      <style jsx>{`
        main{max-width:1200px;margin:auto;padding:40px;font-family:Inter,system-ui;color:#0f172a}.eyebrow{font-size:12px;letter-spacing:2px;font-weight:700}h1{font-size:32px;margin:8px 0}header p{color:#64748b}.settings-nav{display:flex;gap:8px;overflow:auto;margin:28px 0}.settings-nav button{border:1px solid #e2e8f0;background:#fff;padding:10px 14px;border-radius:10px;white-space:nowrap;cursor:pointer}.settings-nav .active{background:#0f172a;color:#fff}.settings-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;min-height:420px}.section-head{display:flex;justify-content:space-between;align-items:center;gap:20px}h2{margin:0}.section-head p{color:#64748b}.primary{background:#0f172a;color:#fff;border:0;border-radius:10px;padding:12px 18px;cursor:pointer}.primary:disabled{opacity:.5}.items-list{display:grid;gap:10px;margin-top:25px}.item{display:flex;justify-content:space-between;align-items:center;border:1px solid #e2e8f0;border-radius:12px;padding:15px 18px}.item small{display:block;color:#64748b;margin-top:4px}.delete{background:transparent;border:0;color:#b91c1c;cursor:pointer}.empty-state{text-align:center;padding:80px 20px;color:#64748b}.program-builder{margin-top:28px;display:grid;gap:20px}.selectors{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.selectors label{font-weight:600}.program-builder select{display:block;margin-top:8px;padding:12px;border:1px solid #cbd5e1;border-radius:8px;width:100%;background:#fff}.semester{border:1px solid #e2e8f0;border-radius:14px;padding:20px;display:grid;gap:10px}.semester h3{margin:0 0 8px}.semester label{padding:10px;background:#f8fafc;border-radius:8px}.semester small{color:#64748b}.toast{margin-top:18px;padding:12px 14px;border-radius:10px;background:#f0fdf4;color:#166534}@media(max-width:700px){main{padding:20px}.selectors{grid-template-columns:1fr}h1{font-size:26px}.section-head{align-items:flex-start;flex-direction:column}}
      `}</style>
    </main>
  )
}
