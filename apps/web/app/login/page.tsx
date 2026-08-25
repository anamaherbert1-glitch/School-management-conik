'use client';

import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Supabase Auth will be wired here after the browser client is added.
      if (!email || !password) throw new Error('Veuillez renseigner votre email et votre mot de passe.');
      setError('Authentification Supabase en cours d’intégration.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand-mark">C</div>
        <p className="eyebrow">SCHOOL MANAGEMENT CONIK</p>
        <h1 id="login-title">Bienvenue</h1>
        <p className="subtitle">Connectez-vous à votre espace de gestion.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email">Adresse email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@ecole.com" />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <button type="submit" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
          {error && <p className="form-message" role="alert">{error}</p>}
        </form>
      </section>
    </main>
  );
}
