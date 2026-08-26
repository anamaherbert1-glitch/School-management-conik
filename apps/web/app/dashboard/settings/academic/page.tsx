'use client'

import { useState } from 'react'

const sections = ['Établissement','Année académique','Départements','Niveaux','Filières','Matières','Programmes','Classes / groupes','Salles','Enseignants']

export default function AcademicSettingsPage() {
  const [active, setActive] = useState('Établissement')
  return (
    <main className="academic-settings">
      <header><p className="eyebrow">CONFIGURATION</p><h1>Configuration de l’établissement</h1><p>Préparez la structure académique avant les admissions et inscriptions.</p></header>
      <nav className="settings-nav">{sections.map(s => <button key={s} className={active===s?'active':''} onClick={()=>setActive(s)}>{s}</button>)}</nav>
      <section className="settings-card">
        <div><h2>{active}</h2><p>Gestion de {active.toLowerCase()} de l’établissement.</p></div>
        {active === 'Programmes' ? <div className="program-builder"><div><strong>Filière</strong><select><option>Génie Civil</option><option>Informatique</option><option>Gestion</option></select></div><div className="semester"><h3>L1 · Semestre 1</h3><label><input type="checkbox" defaultChecked/> Mathématiques</label><label><input type="checkbox" defaultChecked/> Physique</label><label><input type="checkbox"/> Dessin technique</label><label><input type="checkbox"/> Informatique</label></div><button className="primary">Enregistrer le programme</button></div> : <div className="empty-state"><span>⚙</span><h3>{active}</h3><p>La gestion de cette section sera reliée aux données Supabase.</p><button className="primary">Ajouter</button></div>}
      </section>
      <style jsx>{`main{max-width:1200px;margin:auto;padding:40px;font-family:Inter,system-ui}.eyebrow{font-size:12px;letter-spacing:2px;font-weight:700}h1{font-size:32px;margin:8px 0}header p{color:#64748b}.settings-nav{display:flex;gap:8px;overflow:auto;margin:28px 0}.settings-nav button{border:1px solid #e2e8f0;background:#fff;padding:10px 14px;border-radius:10px;white-space:nowrap;cursor:pointer}.settings-nav .active{background:#0f172a;color:#fff}.settings-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;min-height:420px}h2{margin:0}.empty-state{text-align:center;padding:90px 20px;color:#64748b}.empty-state span{font-size:34px}.primary{background:#0f172a;color:#fff;border:0;border-radius:10px;padding:12px 18px;cursor:pointer}.program-builder{margin-top:28px;display:grid;gap:20px}.program-builder select{display:block;margin-top:8px;padding:12px;border:1px solid #cbd5e1;border-radius:8px;width:100%;max-width:400px}.semester{border:1px solid #e2e8f0;border-radius:14px;padding:20px;display:grid;gap:12px}.semester h3{margin:0 0 8px}.semester label{padding:10px;background:#f8fafc;border-radius:8px}`}</style>
    </main>
  )
}
