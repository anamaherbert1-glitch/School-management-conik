'use client'

import { useMemo, useState } from 'react'
import { academicSections, demoPrograms } from './data'

export default function AcademicSettingsPage() {
  const [active, setActive] = useState<(typeof academicSections)[number]>('Établissement')
  const [program, setProgram] = useState('Génie Civil')
  const [level, setLevel] = useState('L1')
  const [semester, setSemester] = useState(1)
  const [subjects, setSubjects] = useState(['Mathématiques', 'Physique'])
  const allSubjects = ['Mathématiques', 'Physique', 'Dessin technique', 'Informatique', 'Mécanique', 'Topographie', 'Matériaux']
  const selected = useMemo(() => subjects, [subjects])
  const toggle = (subject: string) => setSubjects(v => v.includes(subject) ? v.filter(x => x !== subject) : [...v, subject])

  return (
    <main className="academic-settings">
      <header><p className="eyebrow">CONFIGURATION</p><h1>Configuration de l’établissement</h1><p>Préparez la structure académique avant les admissions et inscriptions.</p></header>
      <nav className="settings-nav">{academicSections.map(s => <button key={s} className={active===s?'active':''} onClick={()=>setActive(s)}>{s}</button>)}</nav>
      <section className="settings-card">
        <div><h2>{active}</h2><p>Gestion de {active.toLowerCase()} de l’établissement.</p></div>
        {active === 'Programmes' ? <div className="program-builder">
          <div className="selectors"><label>Filière<select value={program} onChange={e=>setProgram(e.target.value)}><option>Génie Civil</option><option>Informatique</option><option>Gestion</option></select></label><label>Niveau<select value={level} onChange={e=>setLevel(e.target.value)}><option>L1</option><option>L2</option><option>L3</option><option>M1</option><option>M2</option></select></label><label>Semestre<select value={semester} onChange={e=>setSemester(Number(e.target.value))}><option value={1}>Semestre 1</option><option value={2}>Semestre 2</option></select></label></div>
          <div className="semester"><h3>{program} · {level} · Semestre {semester}</h3>{allSubjects.map(s=><label key={s}><input type="checkbox" checked={selected.includes(s)} onChange={()=>toggle(s)}/> {s}</label>)}</div>
          <div className="summary"><strong>{selected.length} matière(s) sélectionnée(s)</strong><span>{selected.join(' · ') || 'Aucune matière'}</span></div>
          <button className="primary" onClick={()=>alert(`Programme ${program} ${level} S${semester} prêt à être enregistré (${selected.length} matières).`)}>Enregistrer le programme</button>
        </div> : <div className="empty-state"><span>⚙</span><h3>{active}</h3><p>La gestion de cette section sera connectée aux tables Supabase correspondantes.</p><button className="primary" onClick={()=>alert(`Ouverture de la gestion : ${active}`)}>Ajouter</button></div>}
      </section>
      <style jsx>{`main{max-width:1200px;margin:auto;padding:40px;font-family:Inter,system-ui}.eyebrow{font-size:12px;letter-spacing:2px;font-weight:700}h1{font-size:32px;margin:8px 0}header p{color:#64748b}.settings-nav{display:flex;gap:8px;overflow:auto;margin:28px 0}.settings-nav button{border:1px solid #e2e8f0;background:#fff;padding:10px 14px;border-radius:10px;white-space:nowrap;cursor:pointer}.settings-nav .active{background:#0f172a;color:#fff}.settings-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;min-height:420px}h2{margin:0}.empty-state{text-align:center;padding:90px 20px;color:#64748b}.empty-state span{font-size:34px}.primary{background:#0f172a;color:#fff;border:0;border-radius:10px;padding:12px 18px;cursor:pointer}.program-builder{margin-top:28px;display:grid;gap:20px}.selectors{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.selectors label{font-weight:600}.program-builder select{display:block;margin-top:8px;padding:12px;border:1px solid #cbd5e1;border-radius:8px;width:100%;background:#fff}.semester{border:1px solid #e2e8f0;border-radius:14px;padding:20px;display:grid;gap:10px}.semester h3{margin:0 0 8px}.semester label{padding:10px;background:#f8fafc;border-radius:8px}.summary{display:flex;flex-direction:column;gap:6px;padding:14px;background:#f8fafc;border-radius:10px}.summary span{color:#64748b}@media(max-width:700px){main{padding:20px}.selectors{grid-template-columns:1fr}h1{font-size:26px}}`}</style>
    </main>
  )
}
