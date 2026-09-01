'use client'

import { useEffect, useMemo, useState } from 'react'

type Student={id:string;name:string;number:string;average:number;rank:number}
type Block={id:string;type:string;x:number;y:number;width:number;height:number;fontSize:number;text:string;opacity:number}
type Template={name:string;pageSize:string;blocks:Block[]}

const demo:Student[]=[
  {id:'1',name:'Kossi Mensah',number:'MAT-0001',average:14.42,rank:1},
  {id:'2',name:'Ama Lawson',number:'MAT-0002',average:13.58,rank:2},
  {id:'3',name:'Jean Doe',number:'MAT-0003',average:12.9,rank:3},
]

const fallbackTemplate:Template={name:'Bulletin collège - Trimestre',pageSize:'A4',blocks:[
  {id:'b1',type:'school_logo',x:35,y:28,width:90,height:70,fontSize:14,text:'{{school_logo}}',opacity:1},
  {id:'b2',type:'heading',x:140,y:35,width:500,height:45,fontSize:22,text:'{{school_name}}',opacity:1},
  {id:'b3',type:'heading',x:170,y:90,width:440,height:42,fontSize:22,text:'BULLETIN SCOLAIRE',opacity:1},
  {id:'b4',type:'student_info',x:35,y:150,width:700,height:62,fontSize:13,text:'Élève : {{student_name}} • Matricule : {{student_number}} • Classe : {{class_name}} • Année : {{academic_year}}',opacity:1},
  {id:'b5',type:'grades_table',x:35,y:235,width:700,height:285,fontSize:11,text:'MATIÈRE | INTERROGATIONS | DEVOIRS | CONTRÔLES | EXAMEN | MOYENNE | COEF.',opacity:1},
  {id:'b6',type:'average',x:440,y:550,width:295,height:42,fontSize:16,text:'Moyenne générale : {{general_average}} / 20',opacity:1},
  {id:'b7',type:'rank',x:440,y:600,width:295,height:35,fontSize:14,text:'Rang : {{rank}}',opacity:1},
  {id:'b8',type:'watermark',x:180,y:335,width:420,height:90,fontSize:34,text:'{{school_name}}',opacity:.09},
  {id:'b9',type:'signature',x:35,y:660,width:700,height:48,fontSize:12,text:'Signature du professeur principal                 Direction / Cachet',opacity:1},
]}

function resolve(text:string,s:Student,className:string,period:string){return text
  .replaceAll('{{school_name}}','NOM DE L’ÉTABLISSEMENT')
  .replaceAll('{{student_name}}',s.name)
  .replaceAll('{{student_number}}',s.number)
  .replaceAll('{{class_name}}',className)
  .replaceAll('{{academic_year}}','2025–2026')
  .replaceAll('{{period}}',period)
  .replaceAll('{{general_average}}',s.average.toFixed(2))
  .replaceAll('{{rank}}',String(s.rank))
  .replaceAll('{{appreciation}}',s.average>=14?'Très bon travail':'Encouragements à poursuivre les efforts')
  .replaceAll('{{school_logo}}','LOGO ÉCOLE')
  .replaceAll('{{student_photo}}','PHOTO ÉLÈVE')}

function printableMarkup(s:Student,template:Template,className:string,period:string){
  const blocks=template.blocks.map(b=>{
    let content=resolve(b.text,s,className,period)
    if(b.type==='grades_table') content=`<table class="grades"><thead><tr><th>Matière</th><th>Interrogations</th><th>Devoirs</th><th>Contrôles</th><th>Examen</th><th>Moyenne</th><th>Coef.</th></tr></thead><tbody><tr><td>Mathématiques</td><td>15</td><td>14</td><td>16</td><td>13</td><td>14.67</td><td>4</td></tr><tr><td>Français</td><td>13</td><td>15</td><td>14</td><td>14</td><td>14.00</td><td>4</td></tr><tr><td>Anglais</td><td>14</td><td>13</td><td>15</td><td>14</td><td>14.00</td><td>2</td></tr></tbody></table>`
    if(b.type==='school_logo') content='<div class="logo">LOGO ÉCOLE</div>'
    if(b.type==='student_photo') content='<div class="photo">PHOTO</div>'
    return `<div class="block block-${b.type}" style="left:${b.x}px;top:${b.y}px;width:${b.width}px;height:${b.height}px;font-size:${b.fontSize}px;opacity:${b.opacity}">${content}</div>`
  }).join('')
  return `<section class="paper">${blocks}</section>`
}

export default function BulletinsPage(){
 const [className,setClassName]=useState('6ème A'),[period,setPeriod]=useState('Trimestre 1'),[students]=useState(demo),[status,setStatus]=useState(''),[selected,setSelected]=useState<Student|null>(null),[template,setTemplate]=useState<Template>(fallbackTemplate)
 useEffect(()=>{try{const raw=localStorage.getItem('conik_bulletin_template');if(raw){const parsed=JSON.parse(raw);if(parsed?.blocks?.length)setTemplate(parsed)}}catch{setStatus('Le modèle local n’a pas pu être chargé. Le modèle par défaut est utilisé.')}},[])
 const selectedMarkup=useMemo(()=>selected?printableMarkup(selected,template,className,period):'', [selected,template,className,period])
 const printOne=(s:Student)=>{const w=window.open('','_blank','noopener,noreferrer');if(!w){setStatus('Autorisez les fenêtres contextuelles pour générer le bulletin.');return};w.document.write(`<!doctype html><html><head><title>Bulletin - ${s.name}</title><style>${printCss()}</style></head><body>${printableMarkup(s,template,className,period)}</body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),250);setStatus(`✓ Bulletin de ${s.name} prêt pour impression / export PDF.`)}
 const generateAll=()=>{const w=window.open('','_blank','noopener,noreferrer');if(!w){setStatus('Autorisez les fenêtres contextuelles pour générer les bulletins.');return};w.document.write(`<!doctype html><html><head><title>Bulletins - ${className}</title><style>${printCss()}</style></head><body>${students.map(s=>printableMarkup(s,template,className,period)).join('<div class="page-break"></div>')}</body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),300);setStatus(`✓ ${students.length} bulletin(s) préparé(s) pour impression / export PDF.`)}
 return <main className="bulletins-page"><header className="grades-header"><div><a className="back-link" href="/dashboard">← Tableau de bord</a><p className="eyebrow">PÉDAGOGIE · BULLETINS</p><h1>Génération des bulletins</h1><p>Le moteur utilise le modèle visuel enregistré et les données du bulletin.</p></div><button className="student-primary" onClick={generateAll}>Générer tous les bulletins</button></header>
 <section className="grade-filters"><label>Classe<select value={className} onChange={e=>setClassName(e.target.value)}><option>6ème A</option><option>6ème B</option><option>5ème A</option></select></label><label>Période<select value={period} onChange={e=>setPeriod(e.target.value)}><option>Trimestre 1</option><option>Trimestre 2</option><option>Trimestre 3</option></select></label><label>Modèle<select value={template.name} readOnly><option>{template.name}</option></select></label><div className="bulletin-summary"><b>{students.length}</b><span>élèves concernés</span></div></section>
 {status&&<div className="grade-message">{status}</div>}
 <section className="students-table-wrap"><table><thead><tr><th>Élève</th><th>Matricule</th><th>Moyenne générale</th><th>Rang</th><th>Action</th></tr></thead><tbody>{students.map(s=><tr key={s.id}><td><b>{s.name}</b></td><td><code>{s.number}</code></td><td><strong>{s.average.toFixed(2)} / 20</strong></td><td>{s.rank}e</td><td><button className="student-secondary" onClick={()=>setSelected(s)}>Aperçu</button>{' '}<button className="student-primary" onClick={()=>printOne(s)}>PDF / Imprimer</button></td></tr>)}</tbody></table></section>
 {selected&&<div className="modal-backdrop" onMouseDown={e=>e.currentTarget===e.target&&setSelected(null)}><section className="student-modal bulletin-preview"><header><div><p className="eyebrow">APERÇU A4</p><h2>Bulletin — {selected.name}</h2></div><button className="modal-close" onClick={()=>setSelected(null)}>×</button></header><div dangerouslySetInnerHTML={{__html:selectedMarkup}}/><footer><button className="student-secondary" onClick={()=>setSelected(null)}>Fermer</button><button className="student-primary" onClick={()=>printOne(selected)}>Générer / Exporter PDF</button></footer></section></div>}
 </main>
}

function printCss(){return `.paper{position:relative;width:794px;height:1123px;background:#fff;margin:0 auto;box-sizing:border-box;overflow:hidden;color:#172033;font-family:Arial,sans-serif}.block{position:absolute;box-sizing:border-box;overflow:hidden}.block-heading{font-weight:700;text-align:center}.block-student_info{padding:12px;border:1px solid #d8dee9;border-radius:6px}.block-grades_table{overflow:visible}.grades{width:100%;border-collapse:collapse;font-size:10px}.grades th,.grades td{border:1px solid #cbd3df;padding:7px 5px;text-align:center}.grades th{font-weight:700;background:#edf2f8}.grades th:first-child,.grades td:first-child{text-align:left}.logo{width:76px;height:58px;border:2px dashed #8a97aa;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700}.photo{width:68px;height:78px;border:1px solid #9aa5b5;display:flex;align-items:center;justify-content:center;font-size:9px}.block-watermark{transform:rotate(-18deg);display:flex;align-items:center;justify-content:center;font-weight:800;color:#30466b}.block-average{font-weight:800;padding:8px;text-align:right}.block-rank{font-weight:700;padding:8px;text-align:right}.block-signature{border-top:1px solid #8d98a8;padding-top:12px}.page-break{page-break-after:always}.page-break:last-child{page-break-after:auto}@page{size:A4 portrait;margin:0}body{margin:0;background:#fff}`}
