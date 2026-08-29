import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/server';
import SignOutButton from './sign-out-button';

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle();
  const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).maybeSingle();
  const organizationId = membership?.organization_id ?? null;

  let organizationName = 'Mon établissement';
  if (organizationId) {
    const { data: organization } = await supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle();
    organizationName = organization?.name ?? organizationName;
  }

  const scopedCount = async (table: string, extra?: (query: any) => any) => {
    if (!organizationId) return 0;
    let query = supabase.from(table).select('id', { count: 'exact', head: true }).eq('organization_id', organizationId);
    if (extra) query = extra(query);
    const { count } = await query;
    return count ?? 0;
  };

  const [students, teachers, programs, applications, enrollments] = await Promise.all([
    scopedCount('students'),
    scopedCount('teachers', (q) => q.eq('is_active', true)),
    scopedCount('programs', (q) => q.eq('is_active', true)),
    scopedCount('admission_applications'),
    scopedCount('student_enrollments', (q) => q.eq('status', 'active')),
  ]);

  const modules = [
    { title: 'Admissions', description: 'Candidatures, pièces et suivi des dossiers.', href: '/admission', icon: 'A' },
    { title: 'Étudiants', description: 'Dossiers, inscriptions et parcours académiques.', href: '#students', icon: 'E' },
    { title: 'Finances', description: 'Frais scolaires, paiements et débiteurs.', href: '#finance', icon: 'F' },
    { title: 'Pédagogie', description: 'Filières, matières, programmes et notes.', href: '#academics', icon: 'P' },
    { title: 'Examens', description: 'Sessions, évaluations et résultats.', href: '#exams', icon: 'X' },
    { title: 'Documents', description: 'Bulletins et documents administratifs.', href: '#documents', icon: 'D' },
  ];

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link href="/dashboard" className="dashboard-brand" aria-label="CONIK - Tableau de bord">
          <span>C</span><div><strong>CONIK</strong><small>School Management</small></div>
        </Link>
        <nav aria-label="Navigation principale">
          <Link className="active" href="/dashboard">Vue d’ensemble</Link>
          <a href="#admissions">Admissions</a><a href="#students">Étudiants</a><a href="#finance">Finances</a><a href="#academics">Pédagogie</a><a href="#exams">Examens</a><a href="#documents">Documents</a><a href="#communication">Communication</a>
          <Link href="/onboarding">Configuration</Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-mini"><div className="avatar">{(profile?.full_name || user.email || 'A').charAt(0).toUpperCase()}</div><div><strong>{profile?.full_name || 'Administrateur'}</strong><small>Administrateur</small></div></div>
          <SignOutButton />
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div><p className="eyebrow">ADMINISTRATION · {organizationName}</p><h1>Tableau de bord</h1><p className="dashboard-muted">Bienvenue{profile?.full_name ? `, ${profile.full_name}` : ''}. Voici la situation actuelle de votre établissement.</p></div>
          <div className="header-actions"><span className="live-dot"><i /> Données en direct</span><div className="user-chip">{profile?.email ?? user.email}</div></div>
        </header>

        <section className="stat-grid" aria-label="Statistiques principales">
          <article className="stat-card"><div className="stat-icon students-icon">E</div><div><span>Étudiants</span><strong>{formatNumber(students)}</strong></div><small>{formatNumber(enrollments)} inscription{enrollments !== 1 ? 's' : ''} active{enrollments !== 1 ? 's' : ''}</small></article>
          <article className="stat-card"><div className="stat-icon teachers-icon">T</div><div><span>Enseignants actifs</span><strong>{formatNumber(teachers)}</strong></div><small>Personnel pédagogique</small></article>
          <article className="stat-card"><div className="stat-icon programs-icon">P</div><div><span>Filières actives</span><strong>{formatNumber(programs)}</strong></div><small>Formations configurées</small></article>
          <article className="stat-card"><div className="stat-icon admissions-icon">A</div><div><span>Candidatures</span><strong>{formatNumber(applications)}</strong></div><small>Total enregistré</small></article>
        </section>

        <section className="dashboard-panel welcome-panel" id="admissions">
          <div><span className="panel-kicker">ÉTAT DU SYSTÈME</span><h2>Votre espace de gestion est opérationnel</h2><p>Les statistiques ci-dessus proviennent directement de votre base Supabase et sont filtrées par établissement.</p></div>
          <Link className="primary-button" href="/admission">Ouvrir les admissions <span>→</span></Link>
        </section>

        <section className="section-heading"><div><p className="eyebrow">MODULES</p><h2>Gérer votre établissement</h2></div><span className="module-count">{modules.length} modules</span></section>
        <section className="module-grid">
          {modules.map((module) => <a className="module-card" href={module.href} key={module.title}><div className="module-icon">{module.icon}</div><div><h3>{module.title}</h3><p>{module.description}</p></div><span className="module-arrow">→</span></a>)}
        </section>

        <section className="quick-section" id="students">
          <div className="section-heading"><div><p className="eyebrow">SUIVI</p><h2>Prochaines étapes</h2></div></div>
          <div className="quick-grid">
            <a href="#academics" className="quick-card"><strong>01</strong><div><h3>Configurer la pédagogie</h3><p>Créer départements, filières, niveaux et matières.</p></div><span>→</span></a>
            <a href="#finance" className="quick-card"><strong>02</strong><div><h3>Préparer les finances</h3><p>Mettre en place les frais et le suivi des paiements.</p></div><span>→</span></a>
            <a href="#communication" className="quick-card"><strong>03</strong><div><h3>Activer la communication</h3><p>Préparer les échanges avec étudiants et enseignants.</p></div><span>→</span></a>
          </div>
        </section>
        <div id="finance" className="anchor-section" /><div id="academics" className="anchor-section" /><div id="exams" className="anchor-section" /><div id="documents" className="anchor-section" /><div id="communication" className="anchor-section" />
      </section>
    </main>
  );
}
