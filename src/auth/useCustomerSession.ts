import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabaseClient } from '../lib/supabase';

export function useCustomerSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseClient) {
      setLoading(false);
      return;
    }
    supabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, loading, configured: Boolean(supabaseClient) };
}
