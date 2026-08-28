'use client';

import Link from 'next/link';

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">CONIK Admissions</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Candidature en ligne</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">Déposez votre candidature en quelques étapes et suivez l’avancement de votre dossier en ligne.</p>
        </header>
        <section className="grid gap-6 md:grid-cols-3">
          {[
            ['01','Choisissez votre formation','Consultez les filières et niveaux ouverts par l’établissement.'],
            ['02','Remplissez votre dossier','Saisissez vos informations et déposez les pièces demandées.'],
            ['03','Suivez votre candidature','Recevez votre numéro de candidature et consultez son statut.'],
          ].map(([n,t,d]) => <article key={n} className="rounded-2xl border bg-white p-6 shadow-sm"><span className="text-sm font-bold text-blue-600">{n}</span><h2 className="mt-3 text-lg font-semibold text-slate-900">{t}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{d}</p></article>)}
        </section>
        <div className="mt-10 text-center"><Link href="/apply/form" className="inline-flex rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm hover:opacity-90">Commencer ma candidature</Link></div>
      </div>
    </main>
  );
}
