import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

type Profile = Tables<'profiles'>;

interface SessionState {
  session: Session | null;
  profile: Profile | null;
  initializing: boolean; // chargement initial de la session
  setSession: (s: Session | null) => void;
  /** Recharge le profil de l'utilisateur courant depuis Supabase. */
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
}

/**
 * État d'authentification global (Zustand).
 * `profile` est null tant que l'utilisateur n'a pas choisi son rôle (onboarding).
 */
export const useSession = create<SessionState>((set, get) => ({
  session: null,
  profile: null,
  initializing: true,

  setSession: (session) => set({ session }),

  refreshProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) {
      set({ profile: null });
      return null;
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    set({ profile: data ?? null });
    return data ?? null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },
}));
