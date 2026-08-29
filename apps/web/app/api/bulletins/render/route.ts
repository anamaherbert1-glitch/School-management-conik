import { NextResponse } from 'next/server'

const escapeHtml=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]!))
const replaceFields=(text:string,data:any)=>text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,(_,k)=>escapeHtml(String(data?.[k]??'')))

export async function POST(req:Request){
 try{
  const body=await req.json(); const payload=body.payload||{}; const def=payload.template||{}; const elements=Array.isArray(def.elements)?def.elements:[]
  const student=payload.student||{}, rows=Array.isArray(payload.grades)?payload.grades:[]
  const data={student_name:student.name||'',student_number:student.student_number||'',class_name:payload.class||'',academic_year:payload.academic_year||'',period:payload.period||'',school_name:payload.school_name||'',general_average:payload.general_average||'',rank:payload.rank||'',appreciation:payload.appreciation||''}
  const rendered=elements.map((e:any)=>({...e,content:replaceFields(String(e.content||''),data)}))
  const table=rendered.find((e:any)=>e.type==='table')
  let tableHtml=''
  if(table){tableHtml=`<table><thead><tr><th>Matière</th><th>Moyenne</th><th>Coefficient</th><th>Évaluations</th></tr></thead><tbody>${rows.map((r:any)=>`<tr><td>${escapeHtml(r.subject||'')}</td><td>${Number(r.average||0).toFixed(2)}</td><td>${escapeHtml(String(r.coefficient??''))}</td><td>${(r.assessments||[]).map((a:any)=>`${escapeHtml(a.type||'')} : ${a.value??''}/${a.max??20}`).join(' · ')}</td></tr>`).join('')}</tbody></table>`}
  const bodyHtml=rendered.filter((e:any)=>e.type!=='table').map((e:any)=>`<div class="el" style="left:${e.x||0}px;top:${e.y||0}px;width:${e.width||200}px;height:${e.height||40}px;font-size:${e.fontSize||14}px;opacity:${e.type==='watermark'?.18:1}">${e.type==='logo'?'<div class="logo">LOGO</div>':e.type==='student_photo'?'<div class="photo">PHOTO ÉLÈVE</div>':escapeHtml(String(e.content||''))}</div>`).join('')
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Bulletin</title><style>@page{size:A4 portrait;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#eee}.paper{position:relative;width:794px;min-height:1123px;margin:0 auto;background:white;overflow:hidden}.el{position:absolute;white-space:pre-wrap}.logo,.photo{display:flex;align-items:center;justify-content:center;border:1px dashed #999;height:100%;width:100%}.photo{border-radius:4px}table{position:absolute;left:${table?.x||35}px;top:${table?.y||250}px;width:${table?.width||700}px;border-collapse:collapse;font-size:${table?.fontSize||12}px}th,td{border:1px solid #777;padding:7px}th{font-weight:700}</style></head><body><div class="paper">${bodyHtml}${tableHtml}</div></body></html>`
  return new NextResponse(html,{headers:{'Content-Type':'text/html; charset=utf-8'}})
 }catch(e){return NextResponse.json({error:'Impossible de rendre le bulletin',details:String(e)},{status:400})}
}
