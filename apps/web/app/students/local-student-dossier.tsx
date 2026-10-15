'use client'

import { useEffect, useState } from 'react'
import { localRuntime, localStudents, localCatalog, type LocalStudent, type LocalEnrollment, type AcademicYear, type LocalClassGroup } from '@/lib/local/tauri'
import { getLocalInstitutionId, localErrorMessage } from '@/lib/local/institution'

type Editable = Omit<LocalStudent, 'id' | 'institution_id' | 'student_number' | 'created_at' | 'updated_at'>
const STATUS_LABEL: Record<string,string> = { active:'Actif', inactive:'Inactif', graduated:'Diplômé', transferred:'Transféré', suspended:'Suspendu' }
const FIELDS: [keyof Editable, string, string?][] = [
  ['first_name','Prénom *'],['last_name','Nom *'],['birth_date','Date de naissance','date'],['birth_place','Lieu de naissance'],['nationality','Nationalité'],
  ['phone','Téléphone'],['email','Email','email'],['address','Adresse'],['city','Ville'],['guardian_name','Parent / tuteur'],['guardian_phone','Téléphone tuteur'],['guardian_email','Email tuteur','email'],
]

export default function LocalStudentDossier({ id }: { id: string }) {
  const [student, setStudent] = useState<LocalStudent | null>(null)
  const [form, setForm] = useState<Editable | null>(null)
  const [enrollments, setEnrollments] = useState<LocalEnrollment[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [classes, setClasses] = useState<LocalClassGroup[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const institutionId = await getLocalInstitutionId()
        if (!institutionId) { window.location.href = '/onboarding'; return }
        const s = await localStudents.getStudent(id)
        if (!s || s.institution_id !== institutionId) { setState('missing'); return }
        const [e, y, c] = await Promise.all([localStudents.listEnrollments(institutionId), localRuntime.listAcademicYears(institutionId), localCatalog.listClassGroups(institutionId)])
        setStudent(s); setForm(s); setEnrollments(e.filter(x => x.student_id === id)); setYears(y); setClasses(c); setState('ready')
      } catch (err) { setMessage(localErrorMessage(err)); setState('error') }
    })()
  }, [id])

  if (state === 'loading') return <main className="students-page"><p>Chargement du dossier…</p></main>
  if (state !== 'ready' || !student || !form) return <main className="students-page"><a className="back-link" href="/students/">← Étudiants</a><div className="students-empty"><strong>{state === 'missing' ? 'Dossier introuvable' : 'Impossible de lire la base locale'}</strong><span>{message}</span></div></main>

  const set = (k: keyof Editable, v: string) => setForm(f => f ? { ...f, [k]: v } : f)
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage('')
    try {
      // Empty strings clear optional fields on the native side.
      const updated = await localStudents.updateStudent({ id: student.id, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v ?? ''])) } as Parameters<typeof localStudents.updateStudent>[0])
      setStudent(updated); setForm(updated); setMessage('Modifications enregistrées.')
    } catch (err) { setMessage(localErrorMessage(err)) } finally { setSaving(false) }
  }
  const yearLabel = (yid: string) => years.find(y => y.id === yid)?.label || '—'
  const className = (cid?: string) => classes.find(c => c.id === cid)?.name || '—'

  return <main className="students-page">
    <header className="students-top"><div><a className="back-link" href="/students/">← Étudiants</a><p className="eyebrow">DOSSIER ÉTUDIANT · HORS LIGNE</p><h1>{student.first_name} {student.last_name}</h1><p>Matricule <code>{student.student_number}</code> · <span className={`status status-${student.status}`}>{STATUS_LABEL[student.status] || student.status}</span></p></div></header>
    <section className="student-modal" style={{ margin: '0 auto', maxHeight: 'none' }}>
      <form onSubmit={save}><div className="form-grid">
        {FIELDS.map(([k, label, type]) => <label key={k}>{label}<input type={type || 'text'} required={label.endsWith('*')} value={(form[k] as string) || ''} onChange={e => set(k, e.target.value)} /></label>)}
        <label>Sexe<select value={form.gender || ''} onChange={e => set('gender', e.target.value)}><option value="">—</option><option value="M">Masculin</option><option value="F">Féminin</option><option value="O">Autre</option></select></label>
        <label>Statut<select value={form.status} onChange={e => set('status', e.target.value)}>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </div>{message && <div className="form-error">{message}</div>}<footer><button disabled={saving} className="student-primary" type="submit">{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</button></footer></form>
    </section>
    <section className="students-table-wrap" style={{ marginTop: 20 }}><table><thead><tr><th>Année académique</th><th>Date d’inscription</th><th>Classe</th><th>Statut</th></tr></thead><tbody>
      {enrollments.map(e => <tr key={e.id}><td>{yearLabel(e.academic_year_id)}</td><td>{e.enrollment_date}</td><td>{className(e.class_group_id)}</td><td><span className={`status status-${e.status}`}>{e.status}</span></td></tr>)}
      {enrollments.length === 0 && <tr><td colSpan={4}><div className="students-empty"><strong>Aucune inscription</strong><span>Les inscriptions seront gérées à l’étape suivante.</span></div></td></tr>}
    </tbody></table></section>
  </main>
}
