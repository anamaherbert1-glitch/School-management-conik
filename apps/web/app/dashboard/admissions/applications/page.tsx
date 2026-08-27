'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState<any | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      let query = supabase.from('admission_applications').select('*').order('created_at', { ascending: false });
      if (status !== 'all') query = query.eq('status', status);
      const { data, error } = await query;
      if (active) {
        if (error) console.error(error);
        setApplications(data ?? []);
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [status]);

  async function updateApplication(id: string, nextStatus: string) {
    const { error } = await supabase.from('admission_applications').update({ status: nextStatus, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) return alert(error.message);
    setSelected(null);
    setStatus(status);
    const { data } = await supabase.from('admission_applications').select('*').order('created_at', { ascending: false });
    setApplications(data ?? []);
  }

  return (
    <main className="p-6 space-y-6">
      <header><h1 className="text-2xl font-semibold">Candidatures</h1><p className="text-sm opacity-70">Consultez et traitez les dossiers d'admission.</p></header>
      <div className="flex flex-wrap gap-2">
        {['all','pending','under_review','incomplete','accepted','rejected'].map(s => <button key={s} onClick={() => setStatus(s)} className="rounded-lg border px-3 py-2 text-sm">{s === 'all' ? 'Toutes' : s === 'pending' ? 'En attente' : s === 'under_review' ? 'À vérifier' : s === 'incomplete' ? 'À compléter' : s === 'accepted' ? 'Acceptées' : 'Refusées'}</button>)}
      </div>
      {loading ? <p>Chargement...</p> : applications.length === 0 ? <p className="rounded-xl border p-6">Aucune candidature.</p> : <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">N°</th><th className="p-3">Candidat</th><th className="p-3">Filière</th><th className="p-3">Statut</th><th className="p-3">Action</th></tr></thead><tbody>{applications.map(a => <tr key={a.id} className="border-b"><td className="p-3">{a.application_number}</td><td className="p-3">{a.first_name} {a.last_name}</td><td className="p-3">{a.program_id ?? '—'}</td><td className="p-3">{a.status}</td><td className="p-3"><button className="underline" onClick={() => setSelected(a)}>Ouvrir</button></td></tr>)}</tbody></table></div>}
      {selected && <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center" onClick={() => setSelected(null)}><section className="max-w-2xl w-full rounded-2xl bg-white p-6 space-y-4" onClick={e => e.stopPropagation()}><div className="flex justify-between"><h2 className="text-xl font-semibold">{selected.first_name} {selected.last_name}</h2><button onClick={() => setSelected(null)}>Fermer</button></div><p>N° candidature : <b>{selected.application_number}</b></p><p>Email : {selected.email || '—'}</p><p>Téléphone : {selected.phone || '—'}</p><p>Statut : {selected.status}</p><div className="flex gap-2"><button onClick={() => updateApplication(selected.id,'under_review')} className="rounded-lg border px-3 py-2">À vérifier</button><button onClick={() => updateApplication(selected.id,'incomplete')} className="rounded-lg border px-3 py-2">À compléter</button><button onClick={() => updateApplication(selected.id,'accepted')} className="rounded-lg border px-3 py-2">Accepter</button><button onClick={() => updateApplication(selected.id,'rejected')} className="rounded-lg border px-3 py-2">Refuser</button></div></section></div>}
    </main>
  );
}
