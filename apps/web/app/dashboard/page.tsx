import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import SignOutButton from './sign-out-button';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle();
  const stats = [['Étudiants','0'],['Enseignants','0'],['Filières','0'],['Paiements du mois','0 FCFA']];
  const modules = [
    ['Admissions','Candidatures, inscriptions et dossiers.'],
    ['Étudiants','Dossiers, parcours et situations.'],
    ['Finances','Frais, paiements et débiteurs.'],
    ['Pédagogie','Programmes, matières, notes et emplois du temps.'],
  ];

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand"><span>C</span><div><strong>CONIK</strong><small>School Management</small></div></div>
        <nav aria-label="Navigation principale">
          <a className="active" href="/dashboard">Vue d’ensemble</a><a href="#admissions">Admissions</a><a href="#students">Étudiants</a><a href="#finance">Finances</a><a href="#academics">Pédagogie</a><a href="#exams">Examens</a><a href="#documents">Documents</a><a href="#communication">Communication</a><a href="#settings">Paramètres</a>
        </nav>
        <SignOutButton />
      </aside>
      <section className="dashboard-main">
        <header className="dashboard-header"><div><p className="eyebrow">ADMINISTRATION</p><h1>Tableau de bord</h1><p className="dashboard-muted">Bienvenue{profile?.full_name ? `, ${profile.full_name}` : ''}.</p></div><div className="user-chip">{profile?.email ?? user.email}</div></header>
        <section className="stat-grid">{stats.map(([label,value]) => <article className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>Données réelles bientôt connectées</small></article>)}</section>
        <section className="dashboard-panel"><div><h2>Activité récente</h2><p>Aucune activité enregistrée pour le moment.</p></div><span className="status-pill">Système prêt</span></section>
        <section className="module-grid">{modules.map(([title,description]) => <article key={title}><h3>{title}</h3><p>{description}</p><a href={`#${title.toLowerCase()}`}>Ouvrir →</a></article>)}</section>
      </section>
    </main>
  );
}
