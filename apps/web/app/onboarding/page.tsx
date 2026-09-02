'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { isDesktopRuntime, localRuntime, LOCAL_INSTITUTION_ID_KEY, nativeInstitutionToDomain } from '../../lib/local/tauri'

const emptyForm = { name: '', slug: '', email: '', phone: '', address: '', city: '', logoUrl: '' }

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function OnboardingPage() {
  const router = useRouter()
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [desktop, setDesktop] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isDesktopRuntime()) {
      setReady(true)
      return
    }

    setDesktop(true)
    setStatus('Initialisation du stockage local…')

    localRuntime.initialize()
      .then(() => {
        const institutionId = window.localStorage.getItem(LOCAL_INSTITUTION_ID_KEY)
        if (!institutionId) {
          setStatus('Mode hors ligne prêt. Configurez votre établissement.')
          return
        }

        return localRuntime.getInstitution(institutionId).then((institution) => {
          if (!institution) {
            window.localStorage.removeItem(LOCAL_INSTITUTION_ID_KEY)
            setStatus('Mode hors ligne prêt. Configurez votre établissement.')
            return
          }

          const domain = nativeInstitutionToDomain(institution)
          setForm({
            name: domain.name,
            slug: domain.slug,
            email: domain.email ?? '',
            phone: domain.phone ?? '',
            address: domain.address ?? '',
            city: domain.city ?? '',
            logoUrl: domain.logoPath ?? '',
          })
          setStatus(`Établissement récupéré localement : ${domain.name}`)
        })
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : String(error)))
      .finally(() => setReady(true))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const slug = form.slug || slugify(form.name)
    setStatus(desktop ? 'Enregistrement local sécurisé…' : 'Création de votre établissement…')

    try {
      if (desktop) {
        const institution = await localRuntime.createInstitution({
          name: form.name,
          slug,
          country_code: 'TG',
          timezone: 'Africa/Lome',
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          logo_path: form.logoUrl || undefined,
        })

        window.localStorage.setItem(LOCAL_INSTITUTION_ID_KEY, institution.id)
        setForm((current) => ({ ...current, slug: institution.slug }))
        setStatus(`Établissement enregistré hors ligne : ${institution.name}`)
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Votre session a expiré. Veuillez vous reconnecter.')

      const { data, error } = await supabase.rpc('create_school_for_current_user', {
        p_name: form.name,
        p_slug: slug,
        p_email: form.email || null,
        p_phone: form.phone || null,
        p_address: form.address || null,
        p_city: form.city || null,
        p_logo_url: form.logoUrl || null,
      })
      if (error) throw error
      if (!data) throw new Error('L’établissement n’a pas pu être créé.')
      setStatus('Établissement créé avec succès. Redirection…')
      router.replace('/dashboard')
      router.refresh()
    } catch (err: any) {
      setStatus(err?.message || 'Impossible de créer l’établissement.')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof typeof emptyForm, value: string) => setForm(v => ({ ...v, [key]: value }))
  const disabled = loading || !ready

  return <main><div className="card"><div className="topline"><p className="eyebrow">CONIK · PREMIÈRE CONFIGURATION</p>{desktop && <span className="badge">● HORS LIGNE</span>}</div><h1>{desktop ? 'Configurez votre établissement' : 'Créez votre établissement'}</h1><p className="intro">{desktop ? 'Les données opérationnelles sont enregistrées sur cet ordinateur et restent disponibles sans Internet.' : 'Votre compte administrateur sera automatiquement associé comme Super Administrateur.'}</p><form onSubmit={submit}>{[['name','Nom de l’établissement *'],['slug','Identifiant local'],['email','Email'],['phone','Téléphone'],['address','Adresse'],['city','Ville'],['logoUrl','Chemin / URL du logo']].map(([k,l])=><label key={k}>{l}<input required={k==='name'} value={form[k as keyof typeof emptyForm]} onChange={e=>set(k as keyof typeof emptyForm,e.target.value)} /></label>)}<button disabled={disabled}>{loading ? 'Enregistrement…' : !ready ? 'Initialisation…' : desktop ? 'Enregistrer localement' : 'Créer mon établissement'}</button></form>{status && <div className="status">{status}</div>}</div><style jsx>{`main{min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fafc;font-family:Inter,system-ui;color:#0f172a}.card{width:min(620px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:32px;box-shadow:0 15px 40px #0f17200d}.topline{display:flex;justify-content:space-between;align-items:center;gap:12px}.eyebrow{font-size:11px;font-weight:800;letter-spacing:2px}.badge{font-size:11px;font-weight:800;color:#166534;background:#dcfce7;padding:6px 9px;border-radius:999px}.intro{color:#64748b;line-height:1.6}form{display:grid;gap:15px;margin-top:24px}label{font-weight:650;font-size:14px}input{display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:12px 13px;border:1px solid #cbd5e1;border-radius:10px;font:inherit}button{margin-top:8px;padding:13px;border:0;border-radius:10px;background:#0f172a;color:#fff;font-weight:700;cursor:pointer}button:disabled{opacity:.6}.status{margin-top:18px;padding:12px;border-radius:10px;background:#f1f5f9;color:#334155}`}</style></main>
}