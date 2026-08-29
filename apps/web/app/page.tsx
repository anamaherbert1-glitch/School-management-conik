import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-extrabold tracking-widest text-blue-600">CONIK</p>
            <p className="mt-1 text-xs text-slate-500">School Management</p>
          </div>
          <Link href="/apply" className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-slate-50">
            Espace candidat
          </Link>
        </header>

        <section className="mt-14 grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-600">Gestion scolaire & universitaire</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Toute votre école, au même endroit.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Admissions, dossiers étudiants et administration réunis dans une plateforme pensée pour les établissements africains.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/apply/form" className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800">
                Candidater en ligne
              </Link>
              <Link href="/apply/track" className="rounded-xl border bg-white px-5 py-3 font-semibold hover:bg-slate-50">
                Suivre une candidature
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Modules en construction</p>
            <div className="mt-4 space-y-3">
              {[
                ['✓', 'Configuration établissement'],
                ['✓', 'Admissions en ligne'],
                ['✓', 'Upload et vérification des documents'],
                ['✓', 'Suivi des candidatures'],
                ['→', 'Espace étudiant'],
                ['→', 'Administration & dossiers étudiants'],
              ].map(([icon, label]) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                  <span className="font-bold text-blue-600">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-16 border-t pt-6 text-xs text-slate-500">
          CONIK — plateforme SaaS de gestion scolaire et universitaire.
        </footer>
      </div>
    </main>
  );
}
