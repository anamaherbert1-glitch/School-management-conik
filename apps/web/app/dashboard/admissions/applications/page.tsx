'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Application = Record<string, any>;
type Document = Record<string, any>;

const labels: Record<string,string> = { all:'Toutes', pending:'En attente', under_review:'À vérifier', incomplete:'À compléter', accepted:'Acceptées', rejected:'Refusées' };

export default function ApplicationsPage() {
  const supabase = createClient();
  const [applications,setApplications]=useState<Application[]>([]), [loading,setLoading]=useState(true), [status,setStatus]=useState('all');
  const [selected,setSelected]=useState<Application|null>(null), [documents,setDocuments]=useState<Document[]>([]), [docLoading,setDocLoading]=useState(false);

  const load = useCallback(async()=>{ setLoading(true); let q=supabase.from('admission_applications').select('*').order('created_at',{ascending:false}); if(status!=='all') q=q.eq('status',status); const {data,error}=await q; if(error) console.error(error); setApplications(data??[]); setLoading(false); },[status]);
  useEffect(()=>{load()},[load]);

  const openApplication=async(a:Application)=>{ setSelected(a); setDocLoading(true); const {data,error}=await supabase.from('admission_application_documents').select('*').eq('application_id',a.id).order('created_at'); if(error) console.error(error); setDocuments(data??[]); setDocLoading(false); };

  const reviewDocument=async(id:string,nextStatus:'verified'|'rejected')=>{ const reason=nextStatus==='rejected'?window.prompt('Motif du rejet de ce document :'):null; if(nextStatus==='rejected'&&!reason?.trim()) return; const {error}=await supabase.from('admission_application_documents').update({status:nextStatus,rejection_reason:reason,verified_at:new Date().toISOString()}).eq('id',id); if(error) return window.alert(error.message); setDocuments(ds=>ds.map(d=>d.id===id?{...d,status:nextStatus,rejection_reason:reason}:d)); };

  const updateApplication=async(id:string,nextStatus:string)=>{ const reason=nextStatus==='rejected'?window.prompt('Motif du refus de la candidature :'):null; if(nextStatus==='rejected'&&!reason?.trim()) return; const {error}=await supabase.from('admission_applications').update({status:nextStatus,rejection_reason:reason,reviewed_at:new Date().toISOString()}).eq('id',id); if(error) return window.alert(error.message); setSelected(null); await load(); };

  const preview=async(d:Document)=>{ const {data,error}=await supabase.storage.from('admission-documents').createSignedUrl(d.file_path,300); if(error||!data?.signedUrl) return window.alert(error?.message||'Impossible d’ouvrir le document.'); window.open(data.signedUrl,'_blank','noopener,noreferrer'); };

  return <main className="p-6 space-y-6"><header><h1 className="text-2xl font-semibold">Candidatures</h1><p className="text-sm opacity-70">Consultez, vérifiez les pièces et traitez les dossiers d’admission.</p></header>
    <div className="flex flex-wrap gap-2">{Object.entries(labels).map(([s,l])=><button key={s} onClick={()=>setStatus(s)} className={`rounded-lg border px-3 py-2 text-sm ${status===s?'font-semibold':''}`}>{l}</button>)}</div>
    {loading?<p>Chargement...</p>:applications.length===0?<p className="rounded-xl border p-6">Aucune candidature.</p>:<div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">N°</th><th className="p-3">Candidat</th><th className="p-3">Filière</th><th className="p-3">Statut</th><th className="p-3">Action</th></tr></thead><tbody>{applications.map(a=><tr key={a.id} className="border-b"><td className="p-3">{a.application_number}</td><td className="p-3">{a.first_name} {a.last_name}</td><td className="p-3">{a.program_id??'—'}</td><td className="p-3">{labels[a.status]??a.status}</td><td className="p-3"><button className="underline" onClick={()=>openApplication(a)}>Ouvrir</button></td></tr>)}</tbody></table></div>}
    {selected&&<div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center overflow-y-auto" onClick={()=>setSelected(null)}><section className="max-w-3xl w-full rounded-2xl bg-white p-6 space-y-5" onClick={e=>e.stopPropagation()}><div className="flex justify-between"><div><h2 className="text-xl font-semibold">{selected.first_name} {selected.last_name}</h2><p className="text-sm opacity-70">{selected.application_number}</p></div><button onClick={()=>setSelected(null)}>Fermer</button></div>
      <div className="grid md:grid-cols-2 gap-3 text-sm"><p><b>Email :</b> {selected.email||'—'}</p><p><b>Téléphone :</b> {selected.phone||'—'}</p><p><b>Adresse :</b> {selected.address||'—'}</p><p><b>Parent/tuteur :</b> {selected.parent_name||'—'}</p><p><b>Statut :</b> {labels[selected.status]||selected.status}</p></div>
      <div><h3 className="font-semibold mb-3">Pièces du dossier</h3>{docLoading?<p>Chargement des documents...</p>:documents.length===0?<p className="rounded-lg border p-4 text-sm">Aucun document enregistré.</p>:<div className="space-y-2">{documents.map(d=><div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-medium">{d.original_name}</p><p className="text-xs opacity-60">{d.status==='verified'?'✓ Vérifié':d.status==='rejected'?'✗ Rejeté':'À vérifier'}</p>{d.rejection_reason&&<p className="text-xs text-red-600">{d.rejection_reason}</p>}</div><div className="flex gap-2"><button className="rounded-lg border px-3 py-2 text-sm" onClick={()=>preview(d)}>Prévisualiser</button><button className="rounded-lg border px-3 py-2 text-sm" onClick={()=>reviewDocument(d.id,'verified')}>✓ Valider</button><button className="rounded-lg border px-3 py-2 text-sm" onClick={()=>reviewDocument(d.id,'rejected')}>✗ Rejeter</button></div></div>)}</div>}</div>
      <div className="flex flex-wrap gap-2 border-t pt-4"><button className="rounded-lg border px-3 py-2" onClick={()=>updateApplication(selected.id,'under_review')}>À vérifier</button><button className="rounded-lg border px-3 py-2" onClick={()=>updateApplication(selected.id,'incomplete')}>À compléter</button><button className="rounded-lg border px-3 py-2" onClick={()=>updateApplication(selected.id,'accepted')}>Accepter</button><button className="rounded-lg border px-3 py-2" onClick={()=>updateApplication(selected.id,'rejected')}>Refuser</button></div>
    </section></div>}
  </main>;
}
