'use client'

import { useEffect, useMemo, useState } from 'react'
import { localStudents, type LocalStudent } from '@/lib/local/tauri'
import { getLocalInstitutionId, localErrorMessage } from '@/lib/local/institution'

type Form = { student_number:string; first_name:string; last_name:string; gender:string; birth_date:string; birth_place:string; nationality:string; phone:string; email:string; address:string; city:string; guardian_name:string; guardian_phone:string; guardian_email:string }
const empty: Form = { student_number:'', first_name:'', last_name:'', gender:'', birth_date:'', birth_place:'', nationality:'', phone:'', email:'', address:'', city:'', guardian_name:'', guardian_phone:'', guardian_email:'' }
const STATUS_LABEL: Record<string,string> = { active:'Actif', inactive:'Inactif', graduated:'Diplômé', transferred:'Transféré', suspended:'Suspendu' }

/** Proposes the next free matricule, e.g. 2026-0007. The native layer still enforces uniqueness. */
function nextNumber(students: LocalStudent[]): string {
  const year = new Date().getFullYear()
  const prefix = `${year}-`
  const max = students.filter(s => s.student_number.startsWith(prefix)).map(s => parseInt(s.student_number.slice(prefix.length), 10)).filter(n => !Number.isNaN(n)).reduce((a, b) => Math.max(a, b), 0)
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export default function LocalStudentManager() {
  const [institutionId, setInstitutionId] = useState<string | null>(null)
  const [students, setStudents] = useState<LocalStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Form>(empty)

  useEffect(() => {
    (async () => {
      try {
        const id = await getLocalInstitutionId()
        if (!id) { window.location.href = '/onboarding'; return }
        setInstitutionId(id)
        setStudents(await localStudents.listStudents(id))
      } catch (err) { setLoadError(localErrorMessage(err)) } finally { setLoading(false) }
    })()
  }, [])

  const filtered = useMemo(() => students.filter(s => {
    const q = search.toLowerCase().trim()
    const hay = `${s.first_name} ${s.last_name} ${s.student_number} ${s.email || ''} ${s.phone || ''}`.toLowerCase()
    return (!q || hay.includes(q)) && (status === 'all' || s.status === status)
  }), [students, search, status])

  const set = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }))
  const openNew = () => { setForm({ ...empty, student_number: nextNumber(students) }); setError(''); setOpen(true) }
  const close = () => { setOpen(false); setError('') }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!institutionId) return
    setError(''); setSaving(true)
    try {
      const opt = (v: string) => v.trim() || undefined
      const created = await localStudents.createStudent({
        institution_id: institutionId, student_number: form.student_number.trim(), first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        gender: opt(form.gender), birth_date: opt(form.birth_date), birth_place: opt(form.birth_place), nationality: opt(form.nationality),
        phone: opt(form.phone), email: opt(form.email), address: opt(form.address), city: opt(form.city),
        guardian_name: opt(form.guardian_name), guardian_phone: opt(form.guardian_phone), guardian_email: opt(form.guardian_email),
      })
      // Only shown after the native SQLite insert succeeded.
      setStudents(s => [...s, created].sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)))
      close()
    } catch (err) { setError(localErrorMessage(err)) } finally { setSaving(false) }
  }

  return <main className="students-page">
    <header className="students-top"><div><a className="back-link" href="/dashboard">← Tableau de bord</a><p className="eyebrow">SCOLARITÉ · HORS LIGNE</p><h1>Étudiants</h1><p>Dossiers enregistrés sur cet ordinateur.</p></div><button className="student-primary" disabled={!institutionId} onClick={openNew}>+ Nouvel étudiant</button></header>
    <section className="student-toolbar"><div className="student-search"><span>⌕</span><input placeholder="Rechercher par nom, matricule, téléphone…" value={search} onChange={e => setSearch(e.target.value)} /></div><select value={status} onChange={e => setStatus(e.target.value)}><option value="all">Tous les statuts</option>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><strong>{filtered.length} étudiant{filtered.length !== 1 ? 's' : ''}</strong></section>
    <section className="students-table-wrap"><table><thead><tr><th>Étudiant</th><th>Matricule</th><th>Sexe</th><th>Naissance</th><th>Contact</th><th>Tuteur</th><th>Statut</th></tr></thead><tbody>
      {filtered.map(s => <tr key={s.id} onClick={() => { window.location.href = `/students/view/?id=${encodeURIComponent(s.id)}` }}>
        <td><div className="student-name"><div>{s.first_name.charAt(0)}{s.last_name.charAt(0)}</div><span><b>{s.first_name} {s.last_name}</b><small>{s.email || 'Aucun email'}</small></span></div></td>
        <td><code>{s.student_number}</code></td><td>{s.gender || '—'}</td><td>{s.birth_date || '—'}</td><td>{s.phone || '—'}</td><td>{s.guardian_name || '—'}</td>
        <td><span className={`status status-${s.status}`}>{STATUS_LABEL[s.status] || s.status}</span></td></tr>)}
      {!loading && filtered.length === 0 && <tr><td colSpan={7}><div className="students-empty"><strong>{loadError ? 'Impossible de lire la base locale' : 'Aucun étudiant trouvé'}</strong><span>{loadError || 'Modifiez votre recherche ou créez un nouveau dossier.'}</span></div></td></tr>}
      {loading && <tr><td colSpan={7}><div className="students-empty"><span>Chargement…</span></div></td></tr>}
    </tbody></table></section>
    {open && <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && close()}><section className="student-modal"><header><div><p className="eyebrow">NOUVEAU DOSSIER</p><h2>Ajouter un étudiant</h2></div><button type="button" className="modal-close" onClick={close}>×</button></header>
      <form onSubmit={save}><div className="form-grid">
        <label>Matricule *<input required value={form.student_number} onChange={e => set('student_number', e.target.value)} /></label>
        <label>Prénom *<input required value={form.first_name} onChange={e => set('first_name', e.target.value)} /></label>
        <label>Nom *<input required value={form.last_name} onChange={e => set('last_name', e.target.value)} /></label>
        <label>Sexe<select value={form.gender} onChange={e => set('gender', e.target.value)}><option value="">Sélectionner</option><option value="M">Masculin</option><option value="F">Féminin</option><option value="O">Autre</option></select></label>
        <label>Date de naissance<input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} /></label>
        <label>Lieu de naissance<input value={form.birth_place} onChange={e => set('birth_place', e.target.value)} /></label>
        <label>Nationalité<input value={form.nationality} onChange={e => set('nationality', e.target.value)} /></label>
        <label>Téléphone<input value={form.phone} onChange={e => set('phone', e.target.value)} /></label>
        <label>Email<input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></label>
        <label>Adresse<input value={form.address} onChange={e => set('address', e.target.value)} /></label>
        <label>Ville<input value={form.city} onChange={e => set('city', e.target.value)} /></label>
        <label>Parent / tuteur<input value={form.guardian_name} onChange={e => set('guardian_name', e.target.value)} /></label>
        <label>Téléphone tuteur<input value={form.guardian_phone} onChange={e => set('guardian_phone', e.target.value)} /></label>
        <label>Email tuteur<input type="email" value={form.guardian_email} onChange={e => set('guardian_email', e.target.value)} /></label>
      </div>{error && <div className="form-error">{error}</div>}<footer><button type="button" className="student-secondary" onClick={close}>Annuler</button><button disabled={saving} className="student-primary" type="submit">{saving ? 'Enregistrement…' : 'Créer le dossier'}</button></footer></form></section></div>}
  </main>
}
