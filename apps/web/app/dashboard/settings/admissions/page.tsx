'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const defaultDocuments = ['BAC / diplôme requis', 'Relevés de notes', "Acte de naissance", 'Photo d’identité']

export default function AdmissionsSettingsPage() {
  const [orgId, setOrgId] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [academicYearId, setAcademicYearId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [fee, setFee] = useState('0')
  const [conditions, setConditions] = useState('')
  const [required, setRequired] = useState<string[]>(defaultDocuments)
  const [optional, setOptional] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      const supabase = createClient()
      const { data: member } = await supabase.from('organization_members').select('organization_id').limit(1).maybeSingle()
      if (!member?.organization_id || !active) return
      setOrgId(member.organization_id)
      const { data } = await supabase.from('admission_settings').select('*').eq('organization_id', member.organization_id).maybeSingle()
      if (!data || !active) return
      setEnabled(data.enabled)
      setAcademicYearId(data.academic_year_id ?? '')
      setStart(data.application_start ? data.application_start.slice(0, 16) : '')
      setEnd(data.application_end ? data.application_end.slice(0, 16) : '')
      setFee(String(data.application_fee ?? 0))
      setConditions(data.admission_conditions ?? '')
      setRequired(Array.isArray(data.required_documents) ? data.required_documents : defaultDocuments)
      setOptional(Array.isArray(data.optional_documents) ? data.optional_documents : [])
    }
    load()
    return () => { active = false }
  }, [])

  const save = async () => {
    setSaving(true); setMessage('')
    const supabase = createClient()
    const payload = {
      organization_id: orgId,
      academic_year_id: academicYearId || null,
      enabled,
      application_start: start ? new Date(start).toISOString() : null,
      application_end: end ? new Date(end).toISOString() : null,
      application_fee: Number(fee) || 0,
      currency: 'XOF',
      required_documents: required,
      optional_documents: optional,
      admission_conditions: conditions || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('admission_settings').upsert(payload, { onConflict: 'organization_id' })
    setSaving(false)
    setMessage(error ? `Erreur : ${error.message}` : 'Paramètres enregistrés avec succès.')
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div><h1 className="text-2xl font-semibold">Paramétrage des admissions</h1><p className="text-sm text-muted-foreground">Configurez les règles de candidature de l’établissement.</p></div>
      <section className="rounded-xl border p-5 space-y-5">
        <label className="flex items-center gap-3"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /><span>Activer les admissions en ligne</span></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label>Année académique<input className="mt-1 w-full rounded-md border p-2" value={academicYearId} onChange={e => setAcademicYearId(e.target.value)} placeholder="ID de l’année académique" /></label>
          <label>Frais de candidature<input type="number" min="0" className="mt-1 w-full rounded-md border p-2" value={fee} onChange={e => setFee(e.target.value)} /></label>
          <label>Ouverture<input type="datetime-local" className="mt-1 w-full rounded-md border p-2" value={start} onChange={e => setStart(e.target.value)} /></label>
          <label>Fermeture<input type="datetime-local" className="mt-1 w-full rounded-md border p-2" value={end} onChange={e => setEnd(e.target.value)} /></label>
        </div>
        <label>Conditions d’admission<textarea className="mt-1 min-h-28 w-full rounded-md border p-2" value={conditions} onChange={e => setConditions(e.target.value)} placeholder="BAC requis, pièces obligatoires, etc." /></label>
      </section>
      <section className="rounded-xl border p-5 space-y-4"><h2 className="font-medium">Pièces obligatoires</h2>{required.map((d,i)=><input key={i} className="w-full rounded-md border p-2" value={d} onChange={e=>setRequired(required.map((x,j)=>j===i?e.target.value:x))}/>) }<button type="button" className="rounded-md border px-3 py-2" onClick={()=>setRequired([...required,''])}>Ajouter une pièce</button></section>
      <section className="rounded-xl border p-5 space-y-4"><h2 className="font-medium">Pièces facultatives</h2>{optional.map((d,i)=><input key={i} className="w-full rounded-md border p-2" value={d} onChange={e=>setOptional(optional.map((x,j)=>j===i?e.target.value:x))}/>) }<button type="button" className="rounded-md border px-3 py-2" onClick={()=>setOptional([...optional,''])}>Ajouter une pièce</button></section>
      <div className="flex items-center gap-4"><button onClick={save} disabled={!orgId || saving} className="rounded-md px-5 py-2 font-medium border disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}</button>{message && <span className="text-sm">{message}</span>}</div>
    </main>
  )
}
