'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EnrollmentsPage() {
  const supabase = createClient();
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from('admission_applications').select('*').eq('status', 'accepted').order('created_at', { ascending: false });
    if (error) setMessage(error.message);
    setApps(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function enroll(a: any) {
    setMessage('');
    const { data: existing } = await supabase.from('student_enrollments').select('id,enrollment_number').eq('application_id', a.id).maybeSingle();
    if (existing) { setMessage(`Cette candidature est déjà inscrite : ${existing.enrollment_number}`); return; }
    const year = new Date().getFullYear();
    const number = `INS-${year}-${String(Date.now()).slice(-6)}`;
    const { data, error } = await supabase.from('student_enrollments').insert({ organization_id: a.organization_id, application_id: a.id, academic_year_id: a.academic_year_id, program_id: a.program_id, level_id: a.level_id, enrollment_number: number, status: 'active' }).select().single();
    if (error) { setMessage(error.message); return; }
    const studentNumber = `CONIK-${year}-${String(Date.now()).slice(-6)}`;
    const { error: studentError } = await supabase.from('students').insert({ organization_id: a.organization_id, application_id: a.id, enrollment_id: data.id, student_number: studentNumber, first_name: a.first_name, last_name: a.last_name, sex: a.sex, date_of_birth: a.date_of_birth, phone: a.phone, email: a.email, address: a.address, parent_name: a.parent_name, parent_phone: a.parent_phone, program_id: a.program_id, level_id: a.level_id, academic_year_id: a.academic_year_id, status: 'active' });
    if (studentError) { await supabase.from('student_enrollments').delete().eq('id', data.id); setMessage(studentError.message); return; }
    setMessage(`Inscription réussie : ${studentNumber}`);
    await load();
  }

  return <main className="p-6 space-y-6"><header><h1 className="text-2xl font-semibold">Inscriptions administratives</h1><p className="text-sm opacity-70">Transformez les candidatures admises en dossiers étudiants.</p></header>{message && <div className="rounded-xl border p-4 text-sm">{message}</div>}{loading ? <p>Chargement...</p> : apps.length === 0 ? <div className="rounded-xl border p-6">Aucune candidature admise à inscrire.</div> : <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">Candidature</th><th className="p-3">Candidat</th><th className="p-3">Filière</th><th className="p-3">Action</th></tr></thead><tbody>{apps.map(a => <tr key={a.id} className="border-b"><td className="p-3">{a.application_number}</td><td className="p-3">{a.first_name} {a.last_name}</td><td className="p-3">{a.program_id ?? '—'}</td><td className="p-3"><button className="rounded-lg border px-3 py-2" onClick={() => enroll(a)}>Inscrire l'étudiant</button></td></tr>)}</tbody></table></div>}</main>;
}
