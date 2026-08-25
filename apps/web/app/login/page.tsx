'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError('Email ou mot de passe incorrect.');
      return;
    }
    router.replace('/dashboard');
    router.refresh();
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
          <input id="email" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@ecole.com" />
          <label htmlFor="password">Mot de passe</label>
          <input id="password" required minLength={6} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          <button type="submit" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}</button>
          {error && <p className="form-message" role="alert">{error}</p>}
        </form>
      </section>
    </main>
  );
}
