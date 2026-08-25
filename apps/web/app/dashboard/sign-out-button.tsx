'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return <button type="button" onClick={signOut} className="sign-out">Se déconnecter</button>;
}
