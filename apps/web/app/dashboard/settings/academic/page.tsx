'use client'

import { useMemo, useState } from 'react'
import { academicSections } from './data'

const seed = {
  Établissement: [{ name: 'School Management Conik', code: 'SMC' }],
  'Année académique': [{ name: '2026–2027', code: '2026-2027' }],
  Départements: [{ name: 'Sciences et Technologies', code: 'ST' }],
  Niveaux: [{ name: 'Licence 1', code: 'L1' }, { name: 'Licence 2', code: 'L2' }, { name: 'Licence 3', code: 'L3' }, { name: 'Master 1', code: 'M1' }, { name: 'Master 2', code: 'M2' }],
  Filières: [{ name: 'Génie Civil', code: 'GC' }, { name: 'Informatique', code: 'INFO' }],
  Matières: [{ name: 'Mathématiques', code: 'MATH' }, { name: 'Physique', code: 'PHY' }, { name: 'Dessin technique', code: 'DT' }],
  'Classes / groupes': [{ name: 'GC-L1-A', code: 'GC-L1-A' }],
  Salles: [{ name: 'Salle A101', code: 'A101' }],
  Enseignants: [{ name: 'Enseignant à affecter', code: 'ENS-001' }],
} as const

type Section = (typeof academicSections)[number]
type Item = { name: string; code?: string }

export default function AcademicSettingsPage() {
  const [active, setActive] = useState<Section>('Établissement')
  const [items, setItems] = useState<Record<string, Item[]>>(() => ({ ...seed }))
  const [program, setProgram] = useState('Génie Civil')
  const [level, setLevel] = useState('L1')
  const [semester, setSemester] = useState(1)
  const [subjects, setSubjects] = useState<string[]>(['Mathématiques', 'Physique'])
  const [message, setMessage] = useState('')
  const allSubjects = ['Mathématiques', 'Physique', 'Dessin technique', 'Informatique', 'Mécanique', 'Topographie', 'Matériaux']
  const current = items[active] ?? []
  const selected = useMemo(() => subjects, [subjects])

  const addItem = () => {
    const name = window.prompt(`Nom à ajouter dans « ${active} »`)
    if (!name?.trim()) return
    const code = window.prompt('Code (optionnel)') || undefined
    setItems(v => ({ ...v, [active]: [...(v[active] ?? []), { name: name.trim(), code }] }))
    setMessage(`${name.trim()} a été ajouté.`)
  }
  const removeItem = (index: number) => {
    if (!window.confirm('Supprimer cet élément ?')) return
    setItems(v => ({ ...v, [active]: (v[active] ?? []).filter((_, i) => i !== index) }))
  }
  const toggle = (subject: string) => setSubjects(v => v.includes(subject) ? v.filter(x => x !== subject) : [...v, subject])
  const saveProgram = () => setMessage(`Programme enregistré : ${program} · ${level} · Semestre ${semester} (${selected.length} matières).`)

  return (
    <main className="academic-settings">
      <header><p className="eyebrow">CONIK · CONFIGURATION</p><h1>Configuration de l’établissement</h1><p>Préparez toute la structure académique avant les admissions et inscriptions.</p></header>
      <nav className="settings-nav">{academicSections.map(s => <button key={s} className={active === s ? 'active' : ''} onClick={() => { setActive(s); setMessage('') }}>{s}</button>)}</nav>
      <section className="settings-card">
        <div className="section-head"><div><h2>{active}</h2><p>{current.length} élément(s) configuré(s)</p></div><button className="primary" onClick={addItem}>+ Ajouter</button></div>
        {active === 'Programmes' ? <div className="program-builder">
          <div className="selectors"><label>Filière<select value={program} onChange={e => setProgram(e.target.value)}><option>Génie Civil</option><option>Informatique</option><option>Gestion</option></select></label><label>Niveau<select value={level} onChange={e => setLevel(e.target.value)}><option>L1</option><option>L2</option><option>L3</option><option>M1</option><option>M2</option></select></label><label>Semestre<select value={semester} onChange={e => setSemester(Number(e.target.value))}><option value={1}>Semestre 1</option><option value={2}>Semestre 2</option></select></label></div>
          <div className="semester"><h3>{program} · {level} · Semestre {semester}</h3>{allSubjects.map(s => <label key={s}><input type="checkbox" checked={selected.includes(s)} onChange={() => toggle(s)} /> {s}</label>)}</div>
          <div className="summary"><strong>{selected.length} matière(s) sélectionnée(s)</strong><span>{selected.join(' · ') || 'Aucune matière'}</span></div>
          <button className="primary" onClick={saveProgram}>Enregistrer le programme</button>
        </div> : <div className="items-list">{current.map((item, i) => <div className="item" key={`${item.name}-${i}`}><div><strong>{item.name}</strong>{item.code && <small>{item.code}</small>}</div><button className="delete" onClick={() => removeItem(i)}>Supprimer</button></div>)}{current.length === 0 && <div className="empty-state"><h3>Aucun élément</h3><p>Ajoutez le premier élément avec le bouton « Ajouter ».</p></div>}</div>}
        {message && <div className="toast">✓ {message}</div>}
      </section>
      <style jsx>{`main{max-width:1200px;margin:auto;padding:40px;font-family:Inter,system-ui;color:#0f172a}.eyebrow{font-size:12px;letter-spacing:2px;font-weight:700}h1{font-size:32px;margin:8px 0}header p{color:#64748b}.settings-nav{display:flex;gap:8px;overflow:auto;margin:28px 0}.settings-nav button{border:1px solid #e2e8f0;background:#fff;padding:10px 14px;border-radius:10px;white-space:nowrap;cursor:pointer}.settings-nav .active{background:#0f172a;color:#fff}.settings-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;min-height:420px}.section-head{display:flex;justify-content:space-between;align-items:center;gap:20px}h2{margin:0}.section-head p{color:#64748b}.primary{background:#0f172a;color:#fff;border:0;border-radius:10px;padding:12px 18px;cursor:pointer}.items-list{display:grid;gap:10px;margin-top:25px}.item{display:flex;justify-content:space-between;align-items:center;border:1px solid #e2e8f0;border-radius:12px;padding:15px 18px}.item small{display:block;color:#64748b;margin-top:4px}.delete{background:transparent;border:0;color:#b91c1c;cursor:pointer}.empty-state{text-align:center;padding:80px 20px;color:#64748b}.program-builder{margin-top:28px;display:grid;gap:20px}.selectors{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.selectors label{font-weight:600}.program-builder select{display:block;margin-top:8px;padding:12px;border:1px solid #cbd5e1;border-radius:8px;width:100%;background:#fff}.semester{border:1px solid #e2e8f0;border-radius:14px;padding:20px;display:grid;gap:10px}.semester h3{margin:0 0 8px}.semester label{padding:10px;background:#f8fafc;border-radius:8px}.summary{display:flex;flex-direction:column;gap:6px;padding:14px;background:#f8fafc;border-radius:10px}.summary span{color:#64748b}.toast{margin-top:18px;padding:12px 14px;border-radius:10px;background:#f0fdf4;color:#166534}@media(max-width:700px){main{padding:20px}.selectors{grid-template-columns:1fr}h1{font-size:26px}.section-head{align-items:flex-start;flex-direction:column}}`}</style>
    </main>
  )
}
