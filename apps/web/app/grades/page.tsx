'use client'

import { useMemo, useState } from 'react'

type Student={id:string;first_name:string;last_name:string;student_number:string}
type Grade={student_id:string;value:number|null;max_value:number;coefficient:number;assessment_type:string}
type Subject={id:string;name:string;code?:string|null}

const demoSubjects:Subject[]=[]

export default function GradesPage(){
 const [subjectId,setSubjectId]=useState(''); const [classId,setClassId]=useState(''); const [assessment,setAssessment]=useState('Contrôle'); const [period,setPeriod]=useState('Trimestre 1'); const [message,setMessage]=useState('')
 const [students,setStudents]=useState<Student[]>([]); const [grades,setGrades]=useState<Record<string,Grade>>({})
 const visible=useMemo(()=>students,[students])
 const load=()=>setMessage(subjectId&&classId?'Liste chargée. Les notes peuvent être saisies.':'Sélectionnez une classe et une matière.')
 const update=(id:string,v:string)=>{const n=v===''?null:Number(v);setGrades(g=>({...g,[id]:{student_id:id,value:n,max_value:20,coefficient:1,assessment_type:assessment}}))}
 const save=async()=>{setMessage('Préparation de l’enregistrement des notes…')}
 return <main className="grades-page"><header className="grades-header"><div><a className="back-link" href="/dashboard">← Tableau de bord</a><p className="eyebrow">PÉDAGOGIE</p><h1>Saisie des notes</h1><p>Choisissez une classe, une matière et une évaluation pour saisir les résultats.</p></div><button className="student-primary" onClick={save}>Enregistrer les notes</button></header>
 <section className="grade-filters"><label>Classe<select value={classId} onChange={e=>setClassId(e.target.value)}><option value="">Sélectionner une classe</option></select></label><label>Matière<select value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">Sélectionner une matière</option>{demoSubjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Évaluation<select value={assessment} onChange={e=>setAssessment(e.target.value)}><option>Contrôle</option><option>Devoir</option><option>Examen</option><option>Partiel</option></select></label><label>Période<select value={period} onChange={e=>setPeriod(e.target.value)}><option>Trimestre 1</option><option>Trimestre 2</option><option>Trimestre 3</option><option>Semestre 1</option><option>Semestre 2</option></select></label><button className="student-secondary" onClick={load}>Charger la classe</button></section>
 {message&&<div className="grade-message">{message}</div>}
 <section className="grades-table-wrap"><table><thead><tr><th>#</th><th>Élève</th><th>Matricule</th><th>Note /20</th><th>Coefficient</th><th>Statut</th></tr></thead><tbody>{visible.map((s,i)=><tr key={s.id}><td>{i+1}</td><td><b>{s.first_name} {s.last_name}</b></td><td><code>{s.student_number}</code></td><td><input className="grade-input" type="number" min="0" max="20" step="0.25" value={grades[s.id]?.value??''} onChange={e=>update(s.id,e.target.value)} placeholder="—"/></td><td><input className="coef-input" type="number" min="0.5" step="0.5" value={grades[s.id]?.coefficient??1} onChange={e=>setGrades(g=>({...g,[s.id]:{student_id:s.id,value:g[s.id]?.value??null,max_value:20,coefficient:Number(e.target.value),assessment_type:assessment}}))}/></td><td>{grades[s.id]?.value==null?'Non saisie':'Saisie'}</td></tr>)}{visible.length===0&&<tr><td colSpan={6}><div className="students-empty"><strong>Aucun élève à afficher</strong><span>La liste apparaîtra après sélection d’une classe et chargement des données.</span></div></td></tr>}</tbody></table></section>
 </main>
}
