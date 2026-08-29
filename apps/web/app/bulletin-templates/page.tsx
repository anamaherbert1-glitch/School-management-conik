'use client'

import { useState } from 'react'

type BlockType='heading'|'text'|'school_logo'|'student_photo'|'student_info'|'grades_table'|'average'|'rank'|'appreciation'|'watermark'|'signature'|'divider'
type Block={id:string;type:BlockType;x:number;y:number;width:number;height:number;fontSize:number;text:string;opacity:number}

const palette:[BlockType,string,string][]=[
 ['heading','Titre','T'],['text','Texte','Aa'],['school_logo','Logo école','▣'],['student_photo','Photo élève','▧'],['student_info','Identité élève','ID'],['grades_table','Tableau des notes','▤'],['average','Moyenne générale','%'],['rank','Rang','№'],['appreciation','Appréciation','✦'],['watermark','Filigrane','◌'],['signature','Signature / cachet','✎'],['divider','Séparateur','—']
]
const tokens:{key:string;label:string}[]=[
 {key:'{{school_name}}',label:'Nom établissement'},{key:'{{school_logo}}',label:'Logo'},{key:'{{student_name}}',label:'Nom élève'},{key:'{{student_number}}',label:'Matricule'},{key:'{{class_name}}',label:'Classe'},{key:'{{academic_year}}',label:'Année scolaire'},{key:'{{period}}',label:'Période'},{key:'{{general_average}}',label:'Moyenne générale'},{key:'{{rank}}',label:'Rang'},{key:'{{appreciation}}',label:'Appréciation'}]

const initial:Block[]=[
{id:'b1',type:'school_logo',x:35,y:28,width:90,height:70,fontSize:14,text:'{{school_logo}}',opacity:1},
{id:'b2',type:'heading',x:140,y:35,width:500,height:45,fontSize:22,text:'{{school_name}}',opacity:1},
{id:'b3',type:'heading',x:170,y:90,width:440,height:42,fontSize:22,text:'BULLETIN SCOLAIRE',opacity:1},
{id:'b4',type:'student_info',x:35,y:150,width:700,height:62,fontSize:13,text:'Élève : {{student_name}}   •   Matricule : {{student_number}}   •   Classe : {{class_name}}   •   Année : {{academic_year}}',opacity:1},
{id:'b5',type:'grades_table',x:35,y:235,width:700,height:285,fontSize:11,text:'MATIÈRE | INTERROGATIONS | DEVOIRS | CONTRÔLES | EXAMEN | MOYENNE | COEF.',opacity:1},
{id:'b6',type:'average',x:440,y:550,width:295,height:42,fontSize:16,text:'Moyenne générale : {{general_average}} / 20',opacity:1},
{id:'b7',type:'rank',x:440,y:600,width:295,height:35,fontSize:14,text:'Rang : {{rank}}',opacity:1},
{id:'b8',type:'watermark',x:180,y:335,width:420,height:90,fontSize:34,text:'{{school_name}}',opacity:.09},
{id:'b9',type:'signature',x:35,y:660,width:700,height:48,fontSize:12,text:'Signature du professeur principal                 Direction / Cachet',opacity:1}]

const label=(t:BlockType)=>palette.find(p=>p[0]===t)?.[1]||'Bloc'

export default function BulletinTemplatesPage(){
 const [blocks,setBlocks]=useState(initial),[selected,setSelected]=useState('b5'),[name,setName]=useState('Bulletin collège - Trimestre'),[saved,setSaved]=useState(false),[zoom,setZoom]=useState(0.9),[drag,setDrag]=useState<{id:string;dx:number;dy:number}|null>(null)
 const active=blocks.find(b=>b.id===selected)||blocks[0]
 const update=(patch:Partial<Block>)=>setBlocks(bs=>bs.map(b=>b.id===active.id?{...b,...patch}:b))
 const add=(type:BlockType)=>{const id=`b${Date.now()}`;const b:Block={id,type,x:90,y:180,width:type==='grades_table'?650:300,height:type==='grades_table'?220:45,fontSize:type==='heading'?20:13,text:type==='heading'?'Nouveau titre':type==='watermark'?'{{school_name}}':type==='student_info'?'Élève : {{student_name}} • Classe : {{class_name}}':type==='grades_table'?'MATIÈRE | NOTES | MOYENNE | COEF.':type==='average'?'Moyenne générale : {{general_average}} / 20':type==='rank'?'Rang : {{rank}}':type==='appreciation'?'{{appreciation}}':type==='school_logo'?'{{school_logo}}':type==='student_photo'?'{{student_photo}}':label(type),opacity:type==='watermark'?.1:1};setBlocks(bs=>[...bs,b]);setSelected(id);setSaved(false)}
 const onPointerDown=(e:React.PointerEvent,id:string)=>{const b=blocks.find(x=>x.id===id);if(!b)return;setSelected(id);setDrag({id,dx:e.clientX-b.x*zoom,dy:e.clientY-b.y*zoom});(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)}
 const onPointerMove=(e:React.PointerEvent)=>{if(!drag)return;setBlocks(bs=>bs.map(b=>b.id===drag.id?{...b,x:Math.max(0,Math.round((e.clientX-drag.dx)/zoom)),y:Math.max(0,Math.round((e.clientY-drag.dy)/zoom))}:b))}
 const save=()=>{localStorage.setItem('conik_bulletin_template',JSON.stringify({name,pageSize:'A4',blocks}));setSaved(true)}
 const token=(value:string)=>update({text:active.text+' '+value})
 return <main className="template-editor-pro"><header className="template-top"><div><a className="back-link" href="/dashboard">← Tableau de bord</a><p className="eyebrow">CONFIGURATION · BULLETINS</p><h1>Créateur de bulletin</h1><p>Construisez votre bulletin avec des blocs, comme un éditeur de pages.</p></div><div className="template-actions"><button className="student-secondary" onClick={()=>setZoom(z=>z===.9?1:.9)}>Zoom {Math.round(zoom*100)}%</button><button className="student-secondary" onClick={()=>setBlocks(initial)}>Réinitialiser</button><button className="student-primary" onClick={save}>Enregistrer le modèle</button></div></header>
 <div className="builder-grid"><aside className="builder-sidebar"><div className="builder-panel"><h3>Blocs</h3><p>Ajoutez un bloc puis placez-le sur la page.</p><div className="block-palette">{palette.map(([type,title,icon])=><button key={type} draggable onDragStart={()=>add(type)} onClick={()=>add(type)}><b>{icon}</b><span>{title}</span></button>)}</div></div><div className="builder-panel"><h3>Champs dynamiques</h3>{tokens.map(t=><button className="token" key={t.key} onClick={()=>token(t.key)}><code>{t.key}</code><span>{t.label}</span></button>)}</div></aside>
 <section className="builder-stage" onPointerMove={onPointerMove} onPointerUp={()=>setDrag(null)}><div className="a4-paper" style={{transform:`scale(${zoom})`,transformOrigin:'top center'}}>{blocks.map(b=><div key={b.id} onPointerDown={e=>onPointerDown(e,b.id)} className={`builder-block ${selected===b.id?'selected':''} block-${b.type}`} style={{position:'absolute',left:b.x,top:b.y,width:b.width,height:b.height,fontSize:b.fontSize,opacity:b.opacity}}>{b.type==='school_logo'?<div className="visual-placeholder">LOGO ÉCOLE</div>:b.type==='student_photo'?<div className="visual-placeholder">PHOTO ÉLÈVE</div>:b.text}</div>)}</div></section>
 <aside className="builder-properties"><div className="builder-panel"><h3>Document</h3><label>Nom du modèle<input value={name} onChange={e=>setName(e.target.value)}/></label><div className="a4-badge">A4 · portrait · 210 × 297 mm</div></div><div className="builder-panel"><h3>Bloc sélectionné</h3><label>Type<input readOnly value={label(active.type)}/></label><label>Contenu<textarea value={active.text} onChange={e=>update({text:e.target.value})}/></label><label>Taille du texte<input type="number" min="8" max="60" value={active.fontSize} onChange={e=>update({fontSize:Number(e.target.value)})}/></label><div className="prop-grid"><label>X<input type="number" value={active.x} onChange={e=>update({x:Number(e.target.value)})}/></label><label>Y<input type="number" value={active.y} onChange={e=>update({y:Number(e.target.value)})}/></label><label>Largeur<input type="number" value={active.width} onChange={e=>update({width:Number(e.target.value)})}/></label><label>Hauteur<input type="number" value={active.height} onChange={e=>update({height:Number(e.target.value)})}/></label></div><label>Opacité<input type="number" min="0" max="1" step=".05" value={active.opacity} onChange={e=>update({opacity:Number(e.target.value)})}/></label><button className="danger-button" onClick={()=>{if(blocks.length>1){setBlocks(bs=>bs.filter(b=>b.id!==active.id));setSelected(blocks.find(b=>b.id!==active.id)?.id||'')}}}>Supprimer le bloc</button>{saved&&<div className="saved-message">✓ Modèle sauvegardé dans cet espace de travail.</div>}</div></aside></div></main>
}
