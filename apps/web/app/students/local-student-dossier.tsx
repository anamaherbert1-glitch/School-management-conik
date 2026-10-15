'use client'

import { useEffect, useState } from 'react'
import { localRuntime, localStudents, localCatalog, type LocalStudent, type LocalEnrollment, type LocalStudentDocument, type AcademicYear, type LocalClassGroup } from '@/lib/local/tauri'
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
  const [documents, setDocuments] = useState<LocalStudentDocument[]>([])
  const [docType, setDocType] = useState('identity')
  const [uploading, setUploading] = useState(false)
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
        const [e, y, c, d] = await Promise.all([localStudents.listEnrollments(institutionId), localRuntime.listAcademicYears(institutionId), localCatalog.listClassGroups(institutionId), localStudents.listDocuments(id)])
        setStudent(s); setForm(s); setEnrollments(e.filter(x => x.student_id === id)); setYears(y); setClasses(c); setDocuments(d); setState('ready')
      } catch (err) { setMessage(localErrorMessage(err)); setState('error') }
    })()
  }, [id])

  if (state === 'loading') return <main className="students-page"><p>Chargement du dossier…</p></main>
  if (state !== 'ready' || !student || !form) return <main className="students-page"><a className="back-link" href="/students/">← Étudiants</a><div className="students-empty"><strong>{state === 'missing' ? 'Dossier introuvable' : 'Impossible de lire la base locale'}</strong><span>{message}</span></div></main>

  const set = (k: keyof Editable, v: string) => setForm(f => f ? { ...f, [k]: v } : f)
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage('')
    try {
      const updated = await localStudents.updateStudent({ id: student.id, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v ?? ''])) } as Parameters<typeof localStudents.updateStudent>[0])
      setStudent(updated); setForm(updated); setMessage('Modifications enregistrées.')
    } catch (err) { setMessage(localErrorMessage(err)) } finally { setSaving(false) }
  }
  const yearLabel = (yid: string) => years.find(y => y.id === yid)?.label || '—'
  const className = (cid?: string) => classes.find(c => c.id === cid)?.name || '—'
  const DOC_LABEL: Record<string, string> = { identity:'Pièce d’identité', birth_certificate:'Acte de naissance', photo:'Photo', transcript:'Relevé / bulletin', medical:'Dossier médical', report:'Rapport', other:'Autre' }
  const formatSize = (n: number) => n < 1024 ? `${n} o` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} Ko` : `${(n / (1024 * 1024)).toFixed(1)} Mo`
  const onPickFile = async (file: File | null) => {
    if (!file || !student) return
    setUploading(true); setMessage('')
    try {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
      const content_base64 = btoa(binary)
      const doc = await localStudents.saveDocument({ student_id: student.id, doc_type: docType, file_name: file.name, content_base64, mime_type: file.type || undefined })
      setDocuments(prev => [doc, ...prev])
      setMessage('Document enregistré hors ligne.')
    } catch (err) { setMessage(localErrorMessage(err)) } finally { setUploading(false) }
  }
  const removeDoc = async (docId: string) => {
    if (!confirm('Supprimer ce document ?')) return
    try {
      await localStudents.deleteDocument(docId)
      setDocuments(prev => prev.filter(d => d.id !== docId))
      setMessage('Document supprimé.')
    } catch (err) { setMessage(localErrorMessage(err)) }
  }
  const openDoc = async (docId: string) => {
    try { await localStudents.openDocument(docId) } catch (err) { setMessage(localErrorMessage(err)) }
  }

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
    <section className="students-table-wrap" style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end', marginBottom: 12 }}>
        <label>Type de document
          <select value={docType} onChange={e => setDocType(e.target.value)}>
            {Object.entries(DOC_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="student-primary" style={{ display: 'inline-block', padding: '8px 14px', cursor: uploading ? 'wait' : 'pointer' }}>
          {uploading ? 'Import…' : 'Ajouter un document'}
          <input type="file" hidden disabled={uploading} onChange={e => onPickFile(e.target.files?.[0] || null)} />
        </label>
      </div>
      <table>
        <thead><tr><th>Type</th><th>Fichier</th><th>Taille</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          {documents.map(d => (
            <tr key={d.id}>
              <td>{DOC_LABEL[d.doc_type] || d.doc_type}</td>
              <td><code>{d.file_name}</code></td>
              <td>{formatSize(d.size_bytes)}</td>
              <td>{new Date(Number(d.created_at)).toLocaleString('fr-FR')}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => openDoc(d.id)}>Ouvrir</button>
                <button type="button" onClick={() => removeDoc(d.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
          {documents.length === 0 && <tr><td colSpan={5}><div className="students-empty"><strong>Aucun document</strong><span>Ajoutez une pièce d’identité, un acte de naissance ou une photo — stockés hors ligne.</span></div></td></tr>}
        </tbody>
      </table>
    </section>
  </main>
}
