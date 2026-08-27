'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Config { organization?: { name?: string; logo_url?: string; city?: string }; settings?: { enabled?: boolean; fee?: number; currency?: string; required_documents?: string[]; optional_documents?: string[]; conditions?: string }; programs?: { id: string; name: string; code?: string; degree_type?: string; duration_semesters?: number }[]; levels?: { id: string; name: string; code?: string }[] }
type FileMap = Record<string, File | null>

const FUNCTION_URL = 'https://ibxuzodulxhrfzlbebuu.supabase.co/functions/v1/admission-upload'

export default function OnlineAdmissionPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<{ number: string; status: string } | null>(null)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<FileMap>({})
  const [form, setForm] = useState({ first_name:'', last_name:'', sex:'', birth_date:'', birth_place:'', nationality:'', address:'', phone:'', email:'', parent_name:'', parent_phone:'', program_id:'', level_id:'' })
  const school = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('school') || ''

  useEffect(() => { const load = async () => { const supabase=createClient(); const {data,error}=await supabase.rpc('get_public_admission_config',{p_organization_slug:school}); if(error) setError(error.message); else setConfig(data); setLoading(false) }; load() }, [school])
  const setField=(key:string,value:string)=>setForm(f=>({...f,[key]:value}))
  const chooseFile=(name:string,file:File|null)=>setFiles(x=>({...x,[name]:file}))

  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setError(''); setSubmitting(true)
    try {
      const required=config?.settings?.required_documents||[]
      const missing=required.filter(d=>!files[d])
      if(missing.length) throw new Error(`Veuillez fournir : ${missing.join(', ')}`)
      const supabase=createClient()
      const {data,error:submitError}=await supabase.rpc('submit_admission_application',{p_organization_slug:school,p_first_name:form.first_name,p_last_name:form.last_name,p_sex:form.sex,p_birth_date:form.birth_date||null,p_birth_place:form.birth_place,p_nationality:form.nationality,p_address:form.address,p_phone:form.phone,p_email:form.email,p_parent_name:form.parent_name,p_parent_phone:form.parent_phone,p_program_id:form.program_id||null,p_level_id:form.level_id||null,p_documents:{}})
      if(submitError) throw submitError
      const result=data?.[0]
      if(!result?.number) throw new Error('La candidature n’a pas retourné de numéro.')
      const {data:lookup,error:lookupError}=await supabase.rpc('get_admission_application_id',{p_organization_slug:school,p_application_number:result.number})
      if(lookupError || !lookup) throw lookupError || new Error('Impossible de récupérer le dossier créé.')
      const applicationId=lookup
      const allDocs=[...(required),...(config?.settings?.optional_documents||[])]
      for(const name of allDocs){
        const file=files[name]
        if(!file) continue
        const fd=new FormData(); fd.append('organization_slug',school); fd.append('application_id',applicationId); fd.append('requirement_name',name); fd.append('file',file)
        const response=await fetch(FUNCTION_URL,{method:'POST',body:fd})
        const body=await response.json().catch(()=>({}))
        if(!response.ok) throw new Error(body.error || `Échec de l’upload : ${name}`)
      }
      setSubmitted(result)
    } catch(err){ setError(err instanceof Error ? err.message : 'Une erreur est survenue.') }
    finally{ setSubmitting(false) }
  }

  if(loading) return <main className="min-h-screen grid place-items-center p-6">Chargement de l’admission…</main>
  if(!config?.organization) return <main className="min-h-screen grid place-items-center p-6"><section className="rounded-2xl border p-8">Établissement introuvable.</section></main>
  if(!config.settings?.enabled) return <main className="min-h-screen grid place-items-center p-6"><section className="max-w-xl rounded-2xl border p-8"><h1 className="text-2xl font-bold">Admissions fermées</h1><p className="mt-2 text-muted-foreground">{config.organization.name} n’accepte pas actuellement les candidatures en ligne.</p></section></main>
  if(submitted) return <main className="min-h-screen grid place-items-center p-6"><section className="max-w-xl rounded-2xl border p-8 text-center"><h1 className="text-3xl font-bold">Candidature envoyée ✅</h1><p className="mt-3">Votre numéro de candidature est :</p><p className="my-4 text-3xl font-bold">{submitted.number}</p><p>Conservez ce numéro pour suivre votre dossier.</p></section></main>
  const required=config.settings.required_documents||[]; const optional=config.settings.optional_documents||[]
  const fileInput=(name:string,requiredFlag:boolean)=><label className="block"><span className="font-medium">{name} {requiredFlag && <span className="text-red-600">*</span>}</span><input type="file" required={requiredFlag} accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="mt-1 w-full rounded-lg border p-3" onChange={e=>chooseFile(name,e.target.files?.[0]||null)}/>{files[name] && <span className="text-xs text-emerald-700">✓ {files[name]?.name}</span>}<span className="block text-xs text-muted-foreground">PDF, JPG, PNG ou WebP · 10 Mo max</span></label>
  return <main className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-4xl space-y-6"><header className="rounded-2xl bg-white border p-6">{config.organization.logo_url && <img src={config.organization.logo_url} alt="Logo" className="h-14 object-contain mb-3"/>}<h1 className="text-3xl font-bold">Admission en ligne</h1><p className="mt-1">{config.organization.name}{config.organization.city ? ` · ${config.organization.city}` : ''}</p>{Number(config.settings.fee)>0 && <p className="mt-3 font-semibold">Frais de candidature : {config.settings.fee} {config.settings.currency||'XOF'}</p>}</header>
  {config.settings.conditions && <section className="rounded-2xl border bg-white p-6"><h2 className="font-semibold">Conditions d’admission</h2><p className="mt-2 whitespace-pre-wrap text-sm">{config.settings.conditions}</p></section>}
  <form onSubmit={submit} className="rounded-2xl border bg-white p-6 space-y-6"><section><h2 className="text-xl font-semibold mb-4">1. Formation demandée</h2><div className="grid md:grid-cols-2 gap-4"><label>Filière<select required className="mt-1 w-full rounded-lg border p-3" value={form.program_id} onChange={e=>setField('program_id',e.target.value)}><option value="">Sélectionner</option>{config.programs?.map(p=><option key={p.id} value={p.id}>{p.name}{p.code?` (${p.code})`:''}</option>)}</select></label><label>Niveau<select required className="mt-1 w-full rounded-lg border p-3" value={form.level_id} onChange={e=>setField('level_id',e.target.value)}><option value="">Sélectionner</option>{config.levels?.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label></div></section>
  <section><h2 className="text-xl font-semibold mb-4">2. Informations personnelles</h2><div className="grid md:grid-cols-2 gap-4">{[['first_name','Prénom'],['last_name','Nom'],['birth_date','Date de naissance'],['birth_place','Lieu de naissance'],['nationality','Nationalité'],['phone','Téléphone'],['email','Email'],['address','Adresse'],['parent_name','Parent / tuteur'],['parent_phone','Téléphone parent / tuteur']].map(([k,l])=><label key={k}>{l}<input required={['first_name','last_name','phone','email'].includes(k)} type={k==='email'?'email':k==='birth_date'?'date':'text'} className="mt-1 w-full rounded-lg border p-3" value={(form as any)[k]} onChange={e=>setField(k,e.target.value)}/></label>)}<label>Sexe<select className="mt-1 w-full rounded-lg border p-3" value={form.sex} onChange={e=>setField('sex',e.target.value)}><option value="">Sélectionner</option><option>F</option><option>M</option></select></label></div></section>
  <section><h2 className="text-xl font-semibold mb-4">3. Pièces du dossier</h2><div className="space-y-4">{required.map(d=>fileInput(d,true))}{optional.map(d=>fileInput(d,false))}</div></section>
  {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">{error}</div>}<button disabled={!school||submitting} className="w-full rounded-xl bg-black text-white p-3 font-semibold disabled:opacity-50">{submitting?'Envoi du dossier…':'Soumettre ma candidature'}</button></form></div></main>
}
