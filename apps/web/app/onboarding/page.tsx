'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', slug: '', email: '', phone: '', address: '', city: '', logoUrl: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('Création de votre établissement…')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Votre session a expiré. Veuillez vous reconnecter.')

      const { data, error } = await supabase.rpc('create_school_for_current_user', {
        p_name: form.name,
        p_slug: form.slug || form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
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
      setLoading(false)
    }
  }

  const set = (key: string, value: string) => setForm(v => ({ ...v, [key]: value }))
  return <main><div className="card"><p className="eyebrow">CONIK · PREMIÈRE CONFIGURATION</p><h1>Créez votre établissement</h1><p className="intro">Votre compte administrateur sera automatiquement associé comme Super Administrateur.</p><form onSubmit={submit}>{[['name','Nom de l’établissement *'],['slug','Identifiant URL'],['email','Email'],['phone','Téléphone'],['address','Adresse'],['city','Ville'],['logoUrl','URL du logo']].map(([k,l])=><label key={k}>{l}<input required={k==='name'} value={(form as any)[k]} onChange={e=>set(k,e.target.value)} /></label>)}<button disabled={loading}>{loading ? 'Création…' : 'Créer mon établissement'}</button></form>{status && <div className="status">{status}</div>}</div><style jsx>{`main{min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fafc;font-family:Inter,system-ui;color:#0f172a}.card{width:min(620px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:32px;box-shadow:0 15px 40px #0f17200d}.eyebrow{font-size:11px;font-weight:800;letter-spacing:2px}.intro{color:#64748b;line-height:1.6}form{display:grid;gap:15px;margin-top:24px}label{font-weight:650;font-size:14px}input{display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:12px 13px;border:1px solid #cbd5e1;border-radius:10px;font:inherit}button{margin-top:8px;padding:13px;border:0;border-radius:10px;background:#0f172a;color:#fff;font-weight:700;cursor:pointer}button:disabled{opacity:.6}.status{margin-top:18px;padding:12px;border-radius:10px;background:#f1f5f9;color:#334155}`}</style></main>
}