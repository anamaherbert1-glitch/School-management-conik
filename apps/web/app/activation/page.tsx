'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ActivationPage() {
  const supabase = useMemo(() => createClient(), []);
  const [licenseKey, setLicenseKey] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function activate(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    const deviceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const { data, error: rpcError } = await supabase.rpc('activate_license', {
      p_license_key: licenseKey.trim().toUpperCase(),
      p_institution_id: institutionId.trim(),
      p_device_id: deviceId,
      p_device_name: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : 'CONIK Web',
      p_app_version: '1.0.0',
    });
    if (rpcError) setError(rpcError.message);
    else if (data?.[0]) setResult(data[0]);
    else setError('Clé ou établissement introuvable.');
    setLoading(false);
  }

  return <main className="min-h-screen bg-slate-950 px-5 py-12 text-white"><div className="mx-auto max-w-lg"><div className="mb-8"><p className="text-sm font-black tracking-[.3em] text-blue-400">CONIK</p><h1 className="mt-3 text-3xl font-black">Activer votre licence</h1><p className="mt-2 text-slate-400">Activez CONIK avec la clé fournie après votre achat.</p></div><form onSubmit={activate} className="space-y-5 rounded-3xl border border-white/10 bg-white/[.06] p-6 shadow-2xl"><label className="block"><span className="mb-2 block text-sm font-semibold">Clé de licence</span><input value={licenseKey} onChange={e=>setLicenseKey(e.target.value)} required placeholder="CNK-XXXXXXXX-XXXXXXXX-XXXXXXXX" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono uppercase outline-none focus:border-blue-400" /></label><label className="block"><span className="mb-2 block text-sm font-semibold">ID de l’établissement</span><input value={institutionId} onChange={e=>setInstitutionId(e.target.value)} required placeholder="UUID de votre établissement" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-blue-400" /></label><button disabled={loading} className="w-full rounded-xl bg-blue-500 px-4 py-3 font-bold transition hover:bg-blue-400 disabled:opacity-50">{loading ? 'Vérification…' : 'Activer CONIK'}</button>{error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}{result && <div className={`rounded-xl border p-4 ${result.is_valid ? 'border-emerald-400/20 bg-emerald-400/10' : 'border-amber-400/20 bg-amber-400/10'}`}><p className="font-bold">{result.is_valid ? '✓ Licence valide' : 'Licence non valide'}</p><p className="mt-1 text-sm text-slate-300">Statut : {result.status} · Édition : {result.edition ?? '—'}</p>{result.expiration_date && <p className="mt-1 text-sm text-slate-300">Expiration : {new Date(result.expiration_date).toLocaleDateString('fr-FR')}</p>}{result.status === 'grace' && <p className="mt-2 text-sm font-semibold text-amber-200">Période de grâce restante : {result.grace_remaining} jour(s).</p>}</div>}</form></div></main>;
}
